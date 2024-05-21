import USFMParser from "sj-usfm-grammar";
import {type Usj } from "@biblionexus-foundation/scribe-editor";

export const Usj2Usfm = async (usj: Usj) => {
    await USFMParser.init();
    const usfmParser = new USFMParser();
    const usfm = usfmParser.usjToUsfm(usj);
    return usfm;
  };
 
