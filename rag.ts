import fs from "node:fs/promises";
import path from "node:path";

import {
  Document,
  MetadataMode,
  NodeWithScore,
  VectorStoreIndex,
} from "llamaindex";

async function getMarkdownFiles(dir: string): Promise<string[]> {
  let markdownFiles: string[] = [];
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      markdownFiles = markdownFiles.concat(await getMarkdownFiles(filePath));
    } else if (file.isFile() && path.extname(file.name) === ".md") {
      markdownFiles.push(filePath);
    }
  }

  return markdownFiles;
}

async function main() {
  const directoryPath = "docs";

  const markdownFiles = await getMarkdownFiles(directoryPath);

  let combinedContent = "";
  for (const filePath of markdownFiles) {
    const content = await fs.readFile(filePath, "utf-8");
    combinedContent += content + "\n";
  }

  const document = new Document({ text: combinedContent, id_: directoryPath });

  const index = await VectorStoreIndex.fromDocuments([document]);

  const queryEngine = index.asQueryEngine();
  const { response, sourceNodes } = await queryEngine.query({
    // We need to have Eliza agent use this function and pass the query
    query: "How to transfer personal circles tokens",
  });

  console.log(response);

  //For future implementation with Pinecone
  if (sourceNodes) {
    sourceNodes.forEach((source: NodeWithScore, index: number) => {
      console.log(
        `\n${index}: Score: ${source.score} - ${source.node.getContent(MetadataMode.NONE).substring(0, 300)}...\n`,
      );
    });
  }
}

main().catch(console.error);