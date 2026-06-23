export interface PDFTheme {
  name: string;

  primary: [number, number, number];
  secondary: [number, number, number];

  tableHeader: [number, number, number];
  tableStripe: [number, number, number];

  text: [number, number, number];
  lightText: [number, number, number];

  totalBox: [number, number, number];
}

export const PDF_THEMES: Record<string, PDFTheme> = {
  purple: {
    name: "Modern Purple",
    primary: [124, 58, 237],
    secondary: [168, 85, 247],
    tableHeader: [124, 58, 237],
    tableStripe: [248,245,255],
    text: [30,41,59],
    lightText: [100,116,139],
    totalBox: [124,58,237],
  },

  blue: {
    name: "Executive Blue",
    primary: [37,99,235],
    secondary: [96,165,250],
    tableHeader: [37,99,235],
    tableStripe: [239,246,255],
    text: [30,41,59],
    lightText: [100,116,139],
    totalBox: [37,99,235],
  },

  black: {
    name: "Minimal Black",
    primary: [17,24,39],
    secondary: [55,65,81],
    tableHeader: [31,41,55],
    tableStripe: [249,250,251],
    text: [17,24,39],
    lightText: [107,114,128],
    totalBox: [17,24,39],
  },

  gold: {
    name: "Luxury Gold",
    primary: [180,83,9],
    secondary: [245,158,11],
    tableHeader: [180,83,9],
    tableStripe: [255,251,235],
    text: [68,64,60],
    lightText: [120,113,108],
    totalBox: [180,83,9],
  },
};