export const fonts = {
    fontFamily: "'Figtree', sans-serif",
    fontFaces: `
      @font-face {
        font-family: "Figtree";
        src: url("/fonts/Figtree/Figtree-Regular.ttf") format("truetype");
        font-weight: normal;
      }
      @font-face {
        font-family: "Figtree";
        src: url("/fonts/Figtree/Figtree-Light.ttf") format("truetype");
        font-weight: 300;
      }
      @font-face {
        font-family: "Figtree";
        src: url("/fonts/Figtree/Figtree-Bold.ttf") format("truetype");
        font-weight: bold;
      }
    `,
  };

  export const injectFontFaces = (): void => {
    const style = document.createElement("style");
    style.innerHTML = fonts.fontFaces;
    document.head.appendChild(style);
  };