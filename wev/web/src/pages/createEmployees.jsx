import { useEffect, useRef, useState } from "react";
import {
  CloudUpload,
  FileUp,
  LayoutDashboard,
  Redo2,
  RotateCcw,
  Undo2,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { useSession } from "../auth-client";
import { apiRequest } from "../api-client";
import * as XLSX from "xlsx";
import { columnName, parseCsv } from "../lib/csv";
import { LocaleType } from "@univerjs/presets";
import { createUniver } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import SheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import "@univerjs/design/lib/index.css";
import "@univerjs/preset-sheets-core/lib/index.css";

const STORAGE_KEY = "payroll_mock_employees_workbook";
const SELECTED_COMPANY_KEY = "payroll_selected_company_id";
const WORKBOOK_NAME = "Employees";

const sampleRows = [
  ["EMP-1001", "Jordan Lee", "jordan.lee@example.com", "Finance", "Payroll Analyst", "Full-time", "2022-03-14", "Active", "New York", 72000],
  ["EMP-1002", "Taylor Morgan", "taylor.morgan@example.com", "People", "HR Coordinator", "Full-time", "2021-08-02", "Active", "Chicago", 64500],
  ["EMP-1003", "Casey Rivera", "casey.rivera@example.com", "Operations", "Office Manager", "Full-time", "2023-01-09", "Active", "Austin", 61000],
  ["EMP-1004", "Avery Patel", "avery.patel@example.com", "Engineering", "Software Engineer", "Full-time", "2020-11-16", "Active", "Remote", 118000],
  ["EMP-1005", "Morgan Chen", "morgan.chen@example.com", "Marketing", "Content Strategist", "Part-time", "2024-02-05", "On leave", "Seattle", 54000],
  ["EMP-1006", "Riley Johnson", "riley.johnson@example.com", "Customer Success", "Support Specialist", "Full-time", "2022-07-18", "Active", "Denver", 58000],
  ["EMP-1007", "Jamie Brooks", "jamie.brooks@example.com", "Finance", "Accounts Assistant", "Contract", "2024-06-03", "Active", "Remote", 52000],
  ["EMP-1008", "Drew Wilson", "drew.wilson@example.com", "Sales", "Account Executive", "Full-time", "2021-04-26", "Active", "Boston", 84000],
];
const employeeHeaders = [
  "Full Name",
  "Email",
  "Department",
  "Position",
  "Employment Type",
  "Start Date",
  "Status",
  "Middle Name",
  "Birthdate",
  "Phone",
  "Address",
  "SSS Number",
  "Pag-IBIG ID",
  "PhilHealth Number",
  "Tax ID Number",
  "Base Salary (PHP)",
  "Daily Rate (PHP)",
  "Hourly Rate (PHP)",
  "Backend ID",
];

const employeeRows = sampleRows.map((row) => [
  row[1],
  row[2],
  row[3],
  row[4],
  row[5],
  row[6],
  row[7],
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
]);

const FIELD_HEADERS = {
  fullName: ["fullname", "name", "employeename"],
  firstName: ["firstname", "givenname"],
  lastName: ["lastname", "surname", "familyname"],
  email: ["email", "emailaddress"],
  department: ["department", "team"],
  position: ["position", "jobtitle", "title"],
  employmentType: ["employmenttype", "type"],
  dateHired: ["datehired", "starthiredate", "startdate", "hiredate", "dateofhire"],
  employmentStatus: ["status", "employeestatus"],
  middleName: ["middlename"],
  extension: ["extension", "extname", "suffix"],
  birthdate: ["birthdate", "dateofbirth", "dob"],
  gender: ["gender", "sex"],
  civilStatus: ["civilstatus", "maritalstatus"],
  phone: ["phone", "phonenumber", "mobile"],
  address: ["address", "homeaddress"],
  socialSecurityNumber: ["socialsecuritynumber", "sssnumber", "sss"],
  pagIbigID: ["pagibig", "pagibigid", "pagibignumber"],
  philhealth: ["philhealth", "philhealthnumber"],
  taxIdNumber: ["taxidnumber", "taxid", "tin"],
  baseSalary: ["basesalaryphp", "basesalary", "salary"],
  dailyRate: ["dailyratephp", "dailyrate"],
  hourlyRate: ["hourlyratephp", "hourlyrate"],
  backendId: ["backendid", "serverid"],
};

function normalizeHeader(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getFieldValue(values, headers, field) {
  const aliases = FIELD_HEADERS[field];
  const index = headers.findIndex((header) =>
    aliases.includes(normalizeHeader(header)),
  );
  return index < 0 ? "" : (values[index] ?? "");
}

const COLUMN = {
  fullName: 0,
  email: 1,
  department: 2,
  position: 3,
  employmentType: 4,
  dateHired: 5,
  employmentStatus: 6,
  middleName: 7,
  birthdate: 8,
  phone: 9,
  address: 10,
  socialSecurityNumber: 11,
  pagIbigID: 12,
  philhealth: 13,
  taxIdNumber: 14,
  baseSalary: 15,
  dailyRate: 16,
  hourlyRate: 17,
  backendId: 18,
};

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Employees", href: "/createEmployees", Icon: Users },
];

const menuItems = {
  File: [
    {
      id: "upload-spreadsheet",
      label: "Upload Excel or CSV to spreadsheet",
      Icon: FileUp,
    },
    { id: "send", label: "Save employees to backend", Icon: CloudUpload },
    { id: "reset", label: "Reset sample data", Icon: RotateCcw },
  ],
  Edit: [
    { id: "undo", label: "Undo", Icon: Undo2 },
    { id: "redo", label: "Redo", Icon: Redo2 },
    { id: "cut", label: "Cut" },
    { id: "copy", label: "Copy" },
    { id: "paste", label: "Paste" },
  ],
};

function initializeWorkbook(workbook, rows = employeeRows) {
  const sheet = workbook.getActiveSheet();
  sheet.getRange("A1:S1").setValues([employeeHeaders]);
  sheet
    .getRange("A1:S1")
    .setBackgroundColor("#1f2937")
    .setFontColor("#ffffff")
    .setFontWeight("bold");
  if (rows.length) {
    sheet.getRange(`A2:S${rows.length + 1}`).setValues(rows);
  }
  sheet.setRowHeight(0, 34);
  [
    200, 240, 150, 190, 145, 120, 110, 130, 120, 140, 220, 150, 140, 150,
    150, 145, 140, 150, 180,
  ].forEach((width, index) => sheet.setColumnWidth(index, width));
}

function replaceSheetWithRows(sheet, parsedRows) {
  const headers = parsedRows[0].map((header) => header.trim());
  if (headers.some((header) => !header)) {
    throw new Error("Every CSV column must have a header.");
  }
  if (parsedRows.length > 1000) {
    throw new Error("The spreadsheet supports up to 1,000 CSV rows.");
  }
  if (headers.length > 19) {
    throw new Error(
      "Spreadsheet upload supports up to 19 columns so backend IDs can be tracked in the sheet.",
    );
  }
  if (parsedRows.some((row) => row.length > headers.length)) {
    throw new Error(
      "A CSV row has more cells than the header. Check commas and quoted fields.",
    );
  }
  if (new Set(headers.map(normalizeHeader)).size !== headers.length) {
    throw new Error("CSV column headers must be unique.");
  }

  if (!headers.some((header) => FIELD_HEADERS.backendId.includes(normalizeHeader(header)))) {
    headers.push("Backend ID");
  }
  const width = headers.length;
  const rows = parsedRows.map((row) =>
    Array.from({ length: width }, (_, index) => {
      const value = row[index] ?? "";
      return value.trimStart().startsWith("=") ? `'${value}` : value;
    }),
  );

  sheet.getRange("A1:T1000").clearContent();
  sheet
    .getRange(`A1:${columnName(width - 1)}${rows.length}`)
    .setValues(rows);
  sheet
    .getRange(`A1:${columnName(width - 1)}1`)
    .setBackgroundColor("#1f2937")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setWrap(true);
  if (rows.length > 1) {
    sheet
      .getRange(`A2:${columnName(width - 1)}${rows.length}`)
      .setWrap(true)
      .setVerticalAlignment("top");
  }
  sheet.setRowHeight(0, 40);
  headers.forEach((header, columnIndex) => {
    const longestCell = rows.reduce(
      (longest, row) =>
        Math.max(
          longest,
          ...String(row[columnIndex] ?? "")
            .split(/\r?\n/)
            .map((line) => line.length),
        ),
      header.length,
    );
    sheet.setColumnWidth(
      columnIndex,
      Math.min(360, Math.max(130, longestCell * 8 + 32)),
    );
  });
  rows.slice(1).forEach((_, rowIndex) => sheet.autoFitRow(rowIndex + 1));
  return rows.length - 1;
}

export default function CreateEmployees() {
  const containerRef = useRef(null);
  const csvInputRef = useRef(null);
  const workbookRef = useRef(null);
  const univerApiRef = useRef(null);
  const backendSaveRef = useRef(false);
  const { data: session } = useSession();
  const [status, setStatus] = useState("Loading spreadsheet…");
  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    () => window.localStorage.getItem(SELECTED_COMPANY_KEY) || "",
  );
  const [companyError, setCompanyError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSavingToBackend, setIsSavingToBackend] = useState(false);

  const uploadSpreadsheetFile = async (file) => {
    try {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Spreadsheet files must be 5 MB or smaller.");
      }
      const isCsv = /\.csv$/i.test(file.name) || file.type === "text/csv";
      let parsedRows;
      if (isCsv) {
        parsedRows = parseCsv(await file.text());
      } else {
        const excelWorkbook = XLSX.read(await file.arrayBuffer(), {
          cellDates: true,
        });
        const firstSheetName = excelWorkbook.SheetNames[0];
        const firstSheet = firstSheetName
          ? excelWorkbook.Sheets[firstSheetName]
          : undefined;
        if (!firstSheet) {
          throw new Error("The Excel file does not contain a readable worksheet.");
        }
        parsedRows = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: "",
          raw: false,
          dateNF: "yyyy-mm-dd",
        });
      }
      const sheet = workbookRef.current?.getActiveSheet();
      if (!sheet) throw new Error("The spreadsheet is not ready yet.");

      const rowCount = replaceSheetWithRows(sheet, parsedRows);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workbookRef.current.save()),
      );
      setStatus(
        `Loaded ${rowCount} rows from ${file.name} into the editable spreadsheet`,
      );
      setError("");
      setServerError("");
    } catch (uploadError) {
      setServerError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not read the spreadsheet file.",
      );
    } finally {
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const adminId = session?.user?.id;
    if (!adminId) return undefined;

    let active = true;
    apiRequest(`/api/companies/admin/${encodeURIComponent(adminId)}`)
      .then((result) => {
        const ownedCompanies = Array.isArray(result?.data) ? result.data : [];
        if (!active) return;
        setCompanies(ownedCompanies);
        setIsLoadingCompanies(false);
        const savedCompanyId = window.localStorage.getItem(
          SELECTED_COMPANY_KEY,
        );
        const initialCompanyId = ownedCompanies.some(
          (company) => company.id === savedCompanyId,
        )
          ? savedCompanyId
          : (ownedCompanies[0]?.id ?? "");
        setSelectedCompanyId(initialCompanyId);
        if (initialCompanyId) {
          window.localStorage.setItem(SELECTED_COMPANY_KEY, initialCompanyId);
        }
      })
      .catch((companyLoadError) => {
        if (active) {
          setIsLoadingCompanies(false);
          setCompanyError(
            companyLoadError instanceof Error
              ? companyLoadError.message
              : "Could not load your companies.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    let active = true;
    let saveTimer;
    let initializationTimer;
    let univer;
    let saveSubscription;

    initializationTimer = window.setTimeout(async () => {
      try {
        if (!active) return;
        if (!containerRef.current) {
          throw new Error("The employee spreadsheet container is unavailable.");
        }

        const savedSnapshot = window.localStorage.getItem(STORAGE_KEY);
        const workbookSnapshot = savedSnapshot
          ? JSON.parse(savedSnapshot)
          : { name: WORKBOOK_NAME };
        const created = createUniver({
          locale: LocaleType.EN_US,
          locales: { [LocaleType.EN_US]: SheetsCoreEnUS },
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current,
              header: true,
              toolbar: true,
              formulaBar: true,
              footer: true,
            }),
          ],
        });
        univer = created.univer;

        const workbook = created.univerAPI.createWorkbook(workbookSnapshot);
        workbookRef.current = workbook;
        univerApiRef.current = created.univerAPI;
        const sheet = workbook.getActiveSheet();
        const headers = sheet.getRange("A1:T1").getValues()[0] ?? [];
        const hasBackendId = headers.some(
          (header) => FIELD_HEADERS.backendId.includes(normalizeHeader(header)),
        );
        const hasEmployeeNameHeader = headers.some((header) =>
          [
            ...FIELD_HEADERS.fullName,
            ...FIELD_HEADERS.firstName,
            ...FIELD_HEADERS.lastName,
          ].includes(normalizeHeader(header)),
        );
        const hasEmployeeDetailHeader = headers.some((header) =>
          [
            ...FIELD_HEADERS.email,
            ...FIELD_HEADERS.dateHired,
            ...FIELD_HEADERS.baseSalary,
            ...FIELD_HEADERS.socialSecurityNumber,
          ].includes(normalizeHeader(header)),
        );
        const hasEmployeeLayout = hasEmployeeNameHeader && hasEmployeeDetailHeader;
        let loadedSuppliedRoster = false;
        if (!savedSnapshot || !hasBackendId || !hasEmployeeLayout) {
          const response = await fetch("./mock_employees_50.csv");
          if (!response.ok) {
            throw new Error("Could not load the supplied employee CSV.");
          }
          const employeeCsv = parseCsv(await response.text());
          if (!active) return;
          replaceSheetWithRows(sheet, employeeCsv);
          loadedSuppliedRoster = true;
        }

        const saveWorkbook = () => {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(workbook.save()),
          );
          if (active && !backendSaveRef.current) {
            setStatus("Draft auto-saved");
          }
        };

        saveSubscription = created.univerAPI.addEvent(
          created.univerAPI.Event.CommandExecuted,
          () => {
            window.clearTimeout(saveTimer);
            saveTimer = window.setTimeout(() => {
              try {
                saveWorkbook();
              } catch (saveError) {
                if (active) {
                  setError(
                    saveError instanceof Error
                      ? saveError.message
                      : "Could not save spreadsheet changes.",
                  );
                }
              }
            }, 300);
          },
        );
        saveWorkbook();
        if (loadedSuppliedRoster) {
          setStatus("Loaded 50 employee rows from the supplied CSV");
        }
      } catch (initializationError) {
        if (active) {
          setError(
            initializationError instanceof Error
              ? initializationError.message
              : "Could not initialize the employee spreadsheet.",
          );
        }
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(initializationTimer);
      window.clearTimeout(saveTimer);
      saveSubscription?.dispose();
      univer?.dispose();
      workbookRef.current = null;
      univerApiRef.current = null;
    };
  }, []);

  const saveWorkbook = () => {
    try {
      const workbook = workbookRef.current;
      if (!workbook) return;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workbook.save()));
      setStatus("Draft auto-saved");
      setError("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save spreadsheet changes.",
      );
    }
    setOpenMenu(null);
  };

  const resetWorkbook = () => {
    if (
      !window.confirm(
        "Replace this in-app draft with the sample records? This does not delete employees already sent to the backend.",
      )
    ) {
      setOpenMenu(null);
      return;
    }
    const workbook = workbookRef.current;
    if (!workbook) return;
    workbook.getActiveSheet().getRange("A1:T1000").clearContent();
    initializeWorkbook(workbook);
    saveWorkbook();
  };

  const saveEmployeesToBackend = async () => {
    if (!selectedCompanyId) {
      throw new Error("Create or select a company before saving employees.");
    }

    const workbook = workbookRef.current;
    if (!workbook) throw new Error("The spreadsheet is not ready yet.");
    const sheet = workbook.getActiveSheet();
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0] ?? [];
    const backendIdColumn = headers.findIndex((header) =>
      FIELD_HEADERS.backendId.includes(normalizeHeader(header)),
    );
    if (backendIdColumn < 0) {
      throw new Error(
        "The CSV needs a blank column for tracking backend IDs. Import it again with fewer columns.",
      );
    }
    const employeeRecords = rows.slice(1).map((cells, index) => ({
      sheetRow: index + 2,
      values: cells,
    }));
    const unsavedRows = employeeRecords.filter(
      ({ values }) =>
        !values[backendIdColumn] &&
        values.some(
          (value, columnIndex) =>
            columnIndex !== backendIdColumn &&
            value !== null &&
            value !== undefined &&
            value !== "",
        ),
    );
    const readyRows = [];
    let incompleteRows = 0;

    for (const record of unsavedRows) {
      const { values, sheetRow } = record;
      const fullName = String(getFieldValue(values, headers, "fullName") ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const firstName =
        String(getFieldValue(values, headers, "firstName") ?? "").trim() ||
        fullName[0] ||
        "";
      const lastName =
        String(getFieldValue(values, headers, "lastName") ?? "").trim() ||
        (fullName.length > 1 ? fullName.at(-1) : "");
      const amounts = [
        getFieldValue(values, headers, "baseSalary"),
        getFieldValue(values, headers, "dailyRate"),
        getFieldValue(values, headers, "hourlyRate"),
      ].map((value) =>
        Number(String(value).replace(/[,\s$₱]/g, "")),
      );
      const requiredValues = [
        firstName,
        lastName,
        String(getFieldValue(values, headers, "dateHired") ?? "").trim(),
        String(
          getFieldValue(values, headers, "socialSecurityNumber") ?? "",
        ).trim(),
        String(getFieldValue(values, headers, "pagIbigID") ?? "").trim(),
        String(getFieldValue(values, headers, "philhealth") ?? "").trim(),
        String(getFieldValue(values, headers, "taxIdNumber") ?? "").trim(),
      ];
      if (
        requiredValues.some((value) => !value) ||
        amounts.some((amount) => !Number.isFinite(amount) || amount <= 0)
      ) {
        incompleteRows += 1;
        continue;
      }

      const type = String(
        getFieldValue(values, headers, "employmentType") ?? "",
      ).toLowerCase();
      const employmentType = type.includes("contract")
        ? "CONTRACT"
        : type.includes("part")
          ? "PART_TIME"
          : "REGULAR";
      const employmentStatus = String(
        getFieldValue(values, headers, "employmentStatus") || "ACTIVE",
      )
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");
      const optionalText = (field) =>
        String(getFieldValue(values, headers, field) ?? "").trim() || null;

      readyRows.push({
        sheetRow,
        body: {
          companyId: selectedCompanyId,
          firstname: firstName,
          middlename:
            optionalText("middleName") ||
            (fullName.length > 2 ? fullName.slice(1, -1).join(" ") : null),
          lastname: lastName,
          extname: optionalText("extension"),
          birthdate: optionalText("birthdate"),
          gender: optionalText("gender"),
          civilStatus: optionalText("civilStatus") || "SINGLE",
          email: optionalText("email"),
          phone: optionalText("phone"),
          address: optionalText("address"),
          employmentType,
          employmentStatus,
          dateHired: String(
            getFieldValue(values, headers, "dateHired"),
          ).trim(),
          department: optionalText("department"),
          position: optionalText("position"),
          socialSecurityNumber: requiredValues[3],
          pagIbigID: requiredValues[4],
          philhealth: requiredValues[5],
          taxIdNumber: requiredValues[6],
          baseSalaryCents: Math.round(amounts[0] * 100),
          dailyRateCents: Math.round(amounts[1] * 100),
          hourlyRateCents: Math.round(amounts[2] * 100),
        },
      });
    }

    if (readyRows.length === 0) {
      if (unsavedRows.length === 0) {
        setStatus("No unsaved employee rows");
      } else {
        setStatus(
          `No rows sent. Complete required fields in ${incompleteRows} unsaved rows.`,
        );
      }
      return;
    }

    setIsSavingToBackend(true);
    backendSaveRef.current = true;
    setServerError("");
    setStatus(`Sending ${readyRows.length} employee record${readyRows.length === 1 ? "" : "s"}…`);
    let savedCount = 0;
    try {
      for (const { body, sheetRow } of readyRows) {
        const result = await apiRequest("/api/employees", {
          method: "POST",
          body,
        });
        if (!result?.data?.id) {
          throw new Error(
            `The server did not return an employee ID for spreadsheet row ${sheetRow}.`,
          );
        }
        sheet
          .getRange(`${columnName(backendIdColumn)}${sheetRow}`)
          .setValue(String(result.data.id));
        savedCount += 1;
      }
      setStatus(
        `Saved ${savedCount} employee${savedCount === 1 ? "" : "s"} to the backend${
          incompleteRows
            ? `; ${incompleteRows} incomplete row${incompleteRows === 1 ? "" : "s"} skipped`
            : ""
        }`,
      );
    } catch (saveError) {
      setStatus("Backend save incomplete");
      setServerError(
        `Saved ${savedCount} employee${savedCount === 1 ? "" : "s"} before the server error: ${
          saveError instanceof Error
            ? saveError.message
            : "Could not save employee records."
        }`,
      );
    } finally {
      backendSaveRef.current = false;
      setIsSavingToBackend(false);
    }
  };

  const runMenuAction = async (actionId) => {
    setOpenMenu(null);
    setServerError("");
    try {
      if (actionId === "upload-spreadsheet") {
        csvInputRef.current?.click();
      } else if (actionId === "send") {
        await saveEmployeesToBackend();
      } else if (actionId === "reset") {
        resetWorkbook();
      } else if (actionId === "undo" || actionId === "redo") {
        const api = univerApiRef.current;
        if (!api) throw new Error("The spreadsheet is not ready yet.");
        await api[actionId]();
      } else if (actionId === "copy" || actionId === "paste") {
        const api = univerApiRef.current;
        if (!api) throw new Error("The spreadsheet is not ready yet.");
        await api[actionId]();
      } else if (actionId === "cut") {
        const api = univerApiRef.current;
        if (!api) throw new Error("The spreadsheet is not ready yet.");
        api.getShortcut().triggerShortcut(
          new KeyboardEvent("keydown", {
            key: "x",
            ctrlKey: true,
            keyCode: api.Enum.KeyCode.X,
          }),
        );
      }
    } catch (actionError) {
      setServerError(
        actionError instanceof Error
          ? actionError.message
          : "Could not complete the spreadsheet action.",
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-muted/30">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background p-4 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2 py-1">
          <div className="flex size-9 items-center justify-center rounded-lg border">
            <LayoutDashboard className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Payroll</p>
            <p className="truncate text-xs text-muted-foreground">
              Admin workspace
            </p>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="flex flex-col gap-1">
          <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">
            Workspace
          </p>
          {navigationItems.map(({ label, href, Icon }) => {
            const active = href === "/createEmployees";
            return (
              <Link
                key={href}
                to={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden p-2 md:p-3">
        <nav
          aria-label="Primary navigation"
          className="flex shrink-0 gap-2 overflow-x-auto md:hidden"
        >
          {navigationItems.map(({ label, href, Icon }) => {
            const active = href === "/createEmployees";
            return (
              <Link
                key={href}
                to={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight">Employees</h1>
          <label className="flex items-center gap-2 text-sm font-medium">
            Company
            <select
              value={selectedCompanyId}
              onChange={(event) => {
                const companyId = event.target.value;
                setSelectedCompanyId(companyId);
                if (companyId) {
                  window.localStorage.setItem(SELECTED_COMPANY_KEY, companyId);
                } else {
                  window.localStorage.removeItem(SELECTED_COMPANY_KEY);
                }
              }}
              disabled={!companies.length}
              className="h-8 min-w-48 rounded-md border bg-background px-3 font-normal"
            >
              {companies.length ? (
                companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))
              ) : (
                <option value="">
                  {isLoadingCompanies ? "Loading companies…" : "No company available"}
                </option>
              )}
            </select>
          </label>
          <p className="text-xs text-muted-foreground" role="status">
            {status}
          </p>
        </header>

        {(companyError || serverError) && (
          <p role="alert" className="shrink-0 text-sm text-destructive">
            {companyError || serverError}
          </p>
        )}

        {!companies.length && !isLoadingCompanies && !companyError && (
          <p className="shrink-0 text-sm text-muted-foreground">
            No company is set up yet.{" "}
            <Link to="/dashboard" className="font-medium underline">
              Set up a company
            </Link>{" "}
            before saving employees.
          </p>
        )}

        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          aria-label="Upload an Excel or CSV file to the spreadsheet"
          onChange={(event) =>
            uploadSpreadsheetFile(event.target.files?.[0])
          }
        />

        <div className="flex shrink-0 items-center gap-1 border-b pb-1">
          {Object.entries(menuItems).map(([label, actions]) => (
            <div className="relative" key={label}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={openMenu === label}
                onClick={() =>
                  setOpenMenu((current) => (current === label ? null : label))
                }
                className={`rounded-md px-3 py-1.5 text-sm ${
                  openMenu === label
                    ? "bg-background font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                {label}
              </button>
              {openMenu === label && (
                <div
                  role="menu"
                  aria-label={`${label} menu`}
                  className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
                >
                  {actions.map(({ id, label: actionLabel, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      onClick={() => runMenuAction(id)}
                      disabled={id === "send" && isSavingToBackend}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                    >
                      {Icon && (
                        <Icon className="size-4" aria-hidden="true" />
                      )}
                      {id === "send" && isSavingToBackend
                        ? "Saving employees…"
                        : actionLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {error ? (
          <section
            className="rounded-lg border border-destructive/30 bg-background p-4 text-sm text-destructive"
            role="alert"
          >
            Could not load the employee spreadsheet: {error}
          </section>
        ) : (
          <section className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
            <div
              ref={containerRef}
              className="h-full min-h-0 w-full"
              aria-label="Editable employee spreadsheet"
            />
          </section>
        )}
      </main>
    </div>
  );
}
