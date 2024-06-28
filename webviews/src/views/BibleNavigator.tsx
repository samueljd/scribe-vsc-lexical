import { useEffect, useState } from "react";
import { BookView } from "../components/BibleNavigator/Book";
import { BookPayload } from "../types";
import { MessageType } from "../../../src/providers/messageTypes";
import { vscode } from "../vscode";
import { renderToPage } from "../utils/main-vscode";
import { ReferenceContextProvider } from "../context/ReferenceContext";

export const BibleNavigator = () => {
  const [bookList, setBookList] = useState<Array<BookPayload> | undefined>(
    undefined
  );

  useEffect(() => {
    if (!bookList) return;
  }, [bookList]);

  const handleBookClick = (book: BookPayload) => {
    vscode.postMessage({
      type: MessageType.OPEN_USFM_FILE,
      payload: { ...book },
    });
  };

  useEffect(() => {
    console.log("bookNavigator mounted");
    vscode.setMessageListeners((event) => {
      switch (event.data.type) {
        case MessageType.BOOKS_IN_WORKSPACE_RESPONSE:
          setBookList(event.data.payload);
          console.log("URI message received.", event.data.payload);
          break;
      }
    });
    vscode.postMessage({
      type: MessageType.SEND_BOOKS_IN_WORKSPACE,
      payload: "usfmExplorer",
    });
  }, []);

  return (
    <ReferenceContextProvider>
      <div className="p-4">
        <div className="space-y-4">
          <BookView onBookClick={handleBookClick} bookList={bookList} />
        </div>
      </div>
    </ReferenceContextProvider>
  );
};

renderToPage(<BibleNavigator />);
