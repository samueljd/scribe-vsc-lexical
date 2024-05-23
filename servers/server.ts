import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import { TextDocument as TextDocumentModel } from 'vscode-languageserver-textdocument';

// Create a connection for the server. The connection uses Node's IPC as a transport.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocumentModel> = new TextDocuments(TextDocumentModel);

connection.onInitialize(() => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
    }
  };
});

documents.onDidSave(async (change) => {
  const document = change.document;
  if (document.languageId === 'json') {
    const jsonContent = document.getText();
    const usfmContent = convertJsonToUsfm(jsonContent);
    // Save the converted USFM content back to the document
    await connection.workspace.applyEdit({
      documentChanges: [
        {
          textDocument: { uri: document.uri, version: document.version },
          edits: [{ range: getFullRange(document), newText: usfmContent }]
        }
      ]
    });
  }
});

documents.listen(connection);
connection.listen();

function convertJsonToUsfm(jsonContent: string): string {
  // Your conversion logic here
  return ''; // Placeholder
}

function getFullRange(document: TextDocumentModel) {
  const start = document.positionAt(0);
  const end = document.positionAt(document.getText().length);
  return { start, end };
}
