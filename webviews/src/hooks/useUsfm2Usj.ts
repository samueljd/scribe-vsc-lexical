import { useEffect, useState } from "react";
import USFMParser from "sj-usfm-grammar";
import { Usj } from "@biblionexus-foundation/scribe-editor";
import { vscode } from "../vscode";

export const useUsfm2Usj = (): Usj => {
  const [document, setDocument] = useState<string | null>(null);
  const [usj, setUsj] = useState<Usj | undefined>(undefined);

  useEffect(() => {
    console.log("setting message listeners");
    vscode.setMessageListeners((event) => {
      switch (event.data.type) {
        case "update": {
          console.log(
            `received message from extension :${event.data.type}`,
            event.data
          );
          setDocument(event.data.payload.usfm);
          break;
        }
        case "fileOpened":
          console.log(`received message from extension :${event.data.type}`);
          break;
      }
    });
  }, []);

  const parseUSFM = async (usfm: string) => {
    console.log("parsing usfm");
    await USFMParser.init();
    const usfmParser = new USFMParser();
    const usj2 = usfmParser.usfmToUsj(usfm);
    usj2 && setUsj(usj2);
  };

  useEffect(() => {
    (async () => document && (await parseUSFM(document)))();
  }, [document]);

  return usj;
};
