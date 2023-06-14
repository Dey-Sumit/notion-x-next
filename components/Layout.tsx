// @ts-nocheck - may need to be at the start of file
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import notionClient from "~/utils/notionClient";
import styles from "../styles/layout.module.css";

const getBlogPage = async (blogId: string) => {
  const res = await notionClient.blocks.children.list({
    block_id: blogId,
  });
  return res;
};

export const Text = ({ text }) => {
  if (!text) {
    return null;
  }
  return text.map((value) => {
    const {
      annotations: { bold, code, color, italic, strikethrough, underline },
      text,
    } = value;
    return (
      <span
        className={[
          bold ? styles.bold : "",
          code ? styles.code : "",
          italic ? styles.italic : "",
          strikethrough ? styles.strikethrough : "",
          underline ? styles.underline : "",
          "mb-4",
        ].join(" ")}
        style={color !== "default" ? { color } : {}}
        key={text.content}
      >
        {text.link ? <a href={text.link.url}>{text.content}</a> : text.content}
      </span>
    );
  });
};

const renderNestedList = (block) => {
  const { type } = block;
  const value = block[type];
  if (!value) return null;

  const isNumberedList = value.children[0].type === "numbered_list_item";

  if (isNumberedList) {
    return <ol>{value.children.map((block) => renderBlock(block))}</ol>;
  }
  return <ul>{value.children.map((block) => renderBlock(block))}</ul>;
};

export const renderBlock = (block) => {
  const { type, id } = block;
  const value = block[type];

  switch (type) {
    case "paragraph":
      return (
        <p className="mb-3 text-gray-600 text-lg">
          <Text text={value.rich_text} />
        </p>
      );
    case "heading_1":
      return (
        <h1 className="my-2 text-3xl font-extrabold text-gray-700">
          <Text text={value.rich_text} />
        </h1>
      );
    case "heading_2":
      return (
        <h2 className="my-2 text-3xl font-extrabold text-gray-700">
          <Text text={value.rich_text} />
        </h2>
      );
    case "heading_3":
      return (
        <h3>
          <Text text={value.rich_text} />
        </h3>
      );
    case "bulleted_list": {
      return (
        <ul class="max-w-md space-y-2 mb-2 text-gray-500 list-disc list-inside text-lg">
          {value.children.map((child) => renderBlock(child))}
        </ul>
      );
    }
    case "numbered_list": {
      return <ol>{value.children.map((child) => renderBlock(child))}</ol>;
    }
    case "bulleted_list_item":
    case "numbered_list_item":
      return (
        <li key={block.id} className="mb-1 text-gray-600">
          <Text text={value.rich_text} />
          {/* {!!value.children && renderNestedList(block)} */}
          {/* TODO : handle Nested List Design           */}
        </li>
      );
    case "to_do":
      return (
        <div>
          <label htmlFor={id}>
            <input type="checkbox" id={id} defaultChecked={value.checked} /> <Text text={value.rich_text} />
          </label>
        </div>
      );
    case "toggle":
      return (
        <details>
          <summary>
            <Text text={value.rich_text} />
          </summary>
          {block.children?.map((child) => (
            <Fragment key={child.id}>{renderBlock(child)}</Fragment>
          ))}
        </details>
      );
    case "child_page":
      return (
        <div
        // className={styles.childPage}
        >
          <strong>{value.title}</strong>
          {block.children.map((child) => renderBlock(child))}
        </div>
      );
    case "image":
      const src = value.type === "external" ? value.external.url : value.file.url;
      const caption = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure>
          <Image width={600} height={600} src={src} alt={caption} className="w-full h-[600px] mx-auto object-contain" />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    case "divider":
      return <hr key={id} />;
    case "quote":
      return <blockquote key={id}>{value.rich_text[0].plain_text}</blockquote>;
    case "code":
      return (
        <pre className={styles.pre}>
          <code className={styles.code_block} key={id}>
            {value.rich_text[0].plain_text}
          </code>
        </pre>
      );
    case "file":
      const src_file = value.type === "external" ? value.external.url : value.file.url;
      const splitSourceArray = src_file.split("/");
      const lastElementInArray = splitSourceArray[splitSourceArray.length - 1];
      const caption_file = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure>
          <div className={styles.file}>
            📎{" "}
            <Link href={src_file} passHref>
              {lastElementInArray.split("?")[0]}
            </Link>
          </div>
          {caption_file && <figcaption>{caption_file}</figcaption>}
        </figure>
      );
    case "bookmark":
      const href = value.url;
      return (
        <a href={href} target="_brank" className={styles.bookmark}>
          {href}
        </a>
      );
    case "table": {
      return (
        <table className={styles.table}>
          <tbody>
            {block.children?.map((child, i) => {
              const RowElement = value.has_column_header && i == 0 ? "th" : "td";
              return (
                <tr key={child.id}>
                  {child.table_row?.cells?.map((cell, i) => {
                    return (
                      <RowElement key={`${cell.plain_text}-${i}`}>
                        <Text text={cell} />
                      </RowElement>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
    case "column_list": {
      return <ColumnList columnId={block.id} />;
    }
    case "column": {
      return <div>{block.children.map((child) => renderBlock(child))}</div>;
    }
    default:
      return `❌ Unsupported block (${type === "unsupported" ? "unsupported by Notion API" : type})`;
  }
};

const ColumnList = async ({ columnId }: { columnId: string }) => {
  const data = await getBlogPage(columnId);
  console.log("ColumnList", { data });

  return (
    <div className=" flex flex-row justify-between space-x-2 my-2">
      {data.results.map((block, index) => (
        <Column columnId={block.id} key={index} />
      ))}
    </div>
  );
};

const Column = async ({ columnId }: { columnId: string }) => {
  const blocks = await getBlogPage(columnId);
  console.log("Column", { data: blocks.results.map((block) => block.id) });

  return (
    <div className=" flex-1  p-4">
      <section>
        {blocks.results.map((block) => (
          <Fragment key={block.id}>{renderBlock(block)}</Fragment>
        ))}
      </section>
    </div>
  );
};
