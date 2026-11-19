
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
  components,
  directives,

  theme: {
    defaultTheme: "light",
      themes: {
      light: {
        dark: false,
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          success: "#4CAF50",
          error: "#FF5252",
          warning: "#FB8C00",
        },
      },
    },
  },
});

export default vuetify;

