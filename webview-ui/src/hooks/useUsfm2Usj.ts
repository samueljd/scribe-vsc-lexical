import { useEffect, useState } from "react";
import USFMParser from "sj-usfm-grammar";
import {type Usj } from "@biblionexus-foundation/scribe-editor";

export const useUsfm2Usj = () => {
  const [usfm, setUsfm] = useState<string>();
  const [usj, setUsj] = useState<Usj>();

  const parseUSFM = async (usfm: string) => {
    await USFMParser.init();
    const usfmParser = new USFMParser();
    const usj = usfmParser.usfmToUsj(usfm);
    usj && setUsj(usj);
  };

  useEffect(() => {
    import("../data/titus.js").then((data) => {
      setUsfm(data.default);
    });
  }, []);

  useEffect(() => {
    (async () => usfm && parseUSFM(usfm))();
  }, [usfm]);

  return { usj };
};
