interface FileNamesToBooks {
  [key: string]: string;
}
export const fileNamesToBooks: FileNamesToBooks = {
  "GEN.usfm": "Genesis",
  "EXO.usfm": "Exodus",
  "LEV.usfm": "Leviticus",
  "NUM.usfm": "Numbers",
  "DEU.usfm": "Deuteronomy",
  "JOS.usfm": "Joshua",
  "JDG.usfm": "Judges",
  "RUT.usfm": "Ruth",
  "1SA.usfm": "1 Samuel",
  "2SA.usfm": "2 Samuel",
  "1KI.usfm": "1 Kings",
  "2KI.usfm": "2 Kings",
  "1CH.usfm": "1 Chronicles",
  "2CH.usfm": "2 Chronicles",
  "EZR.usfm": "Ezra",
  "NEH.usfm": "Nehemiah",
  "EST.usfm": "Esther",
  "JOB.usfm": "Job",
  "PSA.usfm": "Psalms",
  "PRO.usfm": "Proverbs",
  "ECC.usfm": "Ecclesiastes",
  "SNG.usfm": "Song of Solomon",
  "ISA.usfm": "Isaiah",
  "JER.usfm": "Jeremiah",
  "LAM.usfm": "Lamentations",
  "EZK.usfm": "Ezekiel",
  "DAN.usfm": "Daniel",
  "HOS.usfm": "Hosea",
  "JOL.usfm": "Joel",
  "AMO.usfm": "Amos",
  "OBA.usfm": "Obadiah",
  "JON.usfm": "Jonah",
  "MIC.usfm": "Micah",
  "NAM.usfm": "Nahum",
  "HAB.usfm": "Habakkuk",
  "ZEP.usfm": "Zephaniah",
  "HAG.usfm": "Haggai",
  "ZEC.usfm": "Zechariah",
  "MAL.usfm": "Malachi",
  "MAT.usfm": "Matthew",
  "MRK.usfm": "Mark",
  "LUK.usfm": "Luke",
  "JHN.usfm": "John",
  "ACT.usfm": "Acts",
  "ROM.usfm": "Romans",
  "1CO.usfm": "1 Corinthians",
  "2CO.usfm": "2 Corinthians",
  "GAL.usfm": "Galatians",
  "EPH.usfm": "Ephesians",
  "PHP.usfm": "Philippians",
  "COL.usfm": "Colossians",
  "1TH.usfm": "1 Thessalonians",
  "2TH.usfm": "2 Thessalonians",
  "1TI.usfm": "1 Timothy",
  "2TI.usfm": "2 Timothy",
  "TIT.usfm": "Titus",
  "PHM.usfm": "Philemon",
  "HEB.usfm": "Hebrews",
  "JAS.usfm": "James",
  "1PE.usfm": "1 Peter",
  "2PE.usfm": "2 Peter",
  "1JN.usfm": "1 John",
  "2JN.usfm": "2 John",
  "3JN.usfm": "3 John",
  "JUD.usfm": "Jude",
  "REV.usfm": "Revelation",
};
export function getBookNames(fileNames: Array<string>) {
  return fileNames
    .map(
      (fileName) =>
        fileNamesToBooks[fileName as keyof typeof fileNamesToBooks] || null
    )
    .filter((bookName) => bookName !== null);
}

// export function getOrderedBookNames(fileNames: Array<string>): Array<string> {
//   return Object.values(fileNamesToBooks).filter((book) =>
//     fileNames.includes(
//       Object.keys(fileNamesToBooks).find(
//         (key) => fileNamesToBooks[key] === book
//       ) as string
//     )
//   );
// }

// export function getOrderedBookNames(
//   fileNames: Array<string>
// ): Array<BookPayload> {
//   return Object.entries(fileNamesToBooks)
//     .filter(([fileName]) => fileNames.includes(fileName))
//     ?.map(([fileName, bookName]) => ({ bookName, fileName }));
// }
