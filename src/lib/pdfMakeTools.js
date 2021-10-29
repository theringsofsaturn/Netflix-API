import PdfPrinter from "pdfmake";

const getMediaPDFReadableStream = async (
  filteredMedia,
  singleMediaReviews
) => {
  const printer = new PdfPrinter(fonts);
  const base64Poster = await turnToBase64Format(filteredMedia.Poster);

  const docDefinition = {
    content: [
      {
        text: `${filteredMedia.Title} (${filteredMedia.Year}) - ${filteredMedia.Type}`,
        style: "header",
      },
      "\n\n",
      { image: base64Poster, width: 250, style: "centerMe" },
      "\n\n\n",
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: "center",
      },
      subHeader: {
        fontSize: 16,
        bold: true,
      },
      centerMe: {
        alignment: "center",
      },
    },
  };
};


export default getMediaPDFReadableStream