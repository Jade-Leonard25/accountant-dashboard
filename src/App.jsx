import { Link, useNavigate } from "react-router";
import FolderFloat from "./components/FolderFloat";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuGroup,
} from "./components/ui/context-menu";


//// One entry per folder. Add more here instead of copy-pasting JSX.
const folders = [
  {
    id: 1,
    label: "Accountant Department",
    sublabel: "4 notes",
    path: "/accountant_dashboard",
  },
  {
    id: 2,
    label: "Accountant Department",
    sublabel: "4 notes",
    path: "/accountant_dashboard",
  },
  {
    id: 3,
    label: "Accountant Department",
    sublabel: "4 notes",
    path: "/accountant_dashboard",
  },
  {
    id: 4,
    label: "Accountant Department",
    sublabel: "4 notes",
    path: "/accountant_dashboard",
  },
];

// Settings shared by every folder
const  folderStyle = {
  trigger: "hover",
  closeOnSelect: true,
  physics: true,
  drift: 0.5,
  folderColor: "#3f3f46",
  frontColor: "#52525b",
  paperColor: "#f5f5f5",
  itemColor: "#f5f5f5",
  itemTextColor: "#18181b",
  labelColor: "#f5f5f5",
  width: 100,
  height: 100,
  radius: 14,
  spread: 180,
  lift: 26,
  tilt: 8,
  flapAngle: 34,
  restAngle: 16,
  openDuration: 520,
  stagger: 45,
  bounce: 0.3,
};

const App = () => {
  const navigate = useNavigate();

  const actions = [
    { name: "Open", run: (folder) => navigate(folder.path) },
    { name: "Delete", run: (folder) => console.log("Delete", folder.id) },
    { name: "Send to", run: (folder) => console.log("Send to", folder.id) },
    { name: "Move to", run: (folder) => console.log("Move to", folder.id) },
    {
      name: "Properties",
      run: (folder) => console.log("Properties", folder.id),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-gray-200 min-h-screen rounded border-gray-900 shadow-md w-full h-full">
      {folders.map((folder) => (
        <ContextMenu key={folder.id}>
          <ContextMenuTrigger asChild>
            <Link to={folder.path}>
              <FolderFloat
                label={folder.label}
                sublabel={folder.sublabel}
                onSelect={(value, index) => console.log(value, index)}
                {...folderStyle}
              />
            </Link>
          </ContextMenuTrigger>

          <ContextMenuContent>
            <ContextMenuGroup>
              {actions.map((action) => (
                <ContextMenuItem
                  key={action.name}
                  onSelect={() => action.run(folder)}
                >
                  <ContextMenuLabel>{action.name}</ContextMenuLabel>
                </ContextMenuItem>
              ))}
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      ))}

      <Link to="/accountant_dashboard">Accountant Dashboard</Link>
    </div>
  );
};

export default App;
