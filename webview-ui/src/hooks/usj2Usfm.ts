import USFMParser from "sj-usfm-grammar";
import {type Usj } from "@biblionexus-foundation/scribe-editor";

export const Usj2Usfm = (usj: Usj) => {
  let usfm: string;
  const parseUsj = async (usj: Usj) => {
    await USFMParser.init();
    const usfmParser = new USFMParser();
    usfm = usfmParser.usjToUsfm(usj);
    return usfm;
  };
  (async () => {
    usfm = usj && (await parseUsj(usj));
    return usfm;
  })();
};
