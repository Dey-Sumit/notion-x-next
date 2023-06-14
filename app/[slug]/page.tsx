import { ListBlockChildrenResponse } from "@notionhq/client/build/src/api-endpoints";
import { Fragment } from "react";
import { renderBlock } from "~/components/Layout";
import notionClient from "~/utils/notionClient";
import slugify from "slugify";
import Image from "next/image";
import { formatDateToCustomFormat } from "~/utils/format";

type PageProps = {
  params: {
    slug: string;
  };
  searchParams: Record<string, string>;
};

// Return a list of `params` to populate the [slug] dynamic segment
/* export async function generateStaticParams() {
  const data = await notionClient.databases.query({
    database_id: process.env.NOTION_BLOG_DATABASE_ID!,
  });

  const paths: Pick<PageProps, "params">[] = [];

  data.results.forEach((result) => {
    paths.push({
      params: {
        slug: slugify(result?.properties?.Name?.title[0].plain_text).toLowerCase(),
      },
    });
  });

  return {
    paths,
    fallback: false,
  };
} */

type PageObjectResponseCustom = {
  id: string;
  properties: {
    Name: {
      title: {
        plain_text: string;
      }[];
    };
    Tags: {
      multi_select: {
        name: string;
      }[];
    };
    Author: {
      rich_text: {
        plain_text: string;
      }[];
    };
  };
  created_time: string;
  last_edited_time: string;
};

// TODO : handle error
const getBlogPage = async (slug: string) => {
  // 1. get all the blogs
  const data = await notionClient.databases.query({
    database_id: process.env.NOTION_BLOG_DATABASE_ID!,
  });

  // 2. check if the slugified title matches the slug and return the id
  const page = data.results.find((_result) => {
    const result = _result as unknown as PageObjectResponseCustom;
    const resultSlug = slugify(result?.properties?.Name?.title[0].plain_text).toLowerCase();
    return resultSlug === slug;
  }) as unknown as PageObjectResponseCustom;

  const blocks = await notionClient.blocks.children.list({
    block_id: page?.id!, // TODO : handle error
  });

  return {
    title: page?.properties?.Name?.title[0].plain_text,
    createdAt: page?.created_time,
    updatedAt: page?.last_edited_time,
    tags: page?.properties?.Tags?.multi_select.map((tag) => tag.name),
    author: page?.properties?.Author?.rich_text[0].plain_text,
    blocks: blocks?.results,
    // add cover image here
  };
};

const BlogPage = async ({ params }: PageProps) => {
  const data = await getBlogPage(params.slug);

  return (
    <main className="pt-8 pb-16 lg:pt-16 lg:pb-24 bg-white ">
      <div className="flex justify-between px-4 mx-auto max-w-3xl ">
        <article className="mx-auto w-full ">
          <header className="mb-4 lg:mb-6 not-format">
            <h1 className="mb-4  text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-4xl ">
              {data.title}
            </h1>
            <address className="flex items-center mb-6 not-italic">
              <div className="inline-flex items-center mr-3 text-sm text-gray-900 ">
                <Image
                  width={64}
                  height={64}
                  className="mr-4 w-16 h-16 rounded-full"
                  src="https://api.dicebear.com/6.x/pixel-art/png"
                  alt={data.author}
                />
                <div>
                  <a href="#" rel="author" className="text-xl font-bold text-gray-900 ">
                    {data.author}
                  </a>
                  <p className="text-base font-light text-gray-600 dark:text-gray-400">
                    {/* // TODO : hardcoded as of now */}
                    Graphic Designer, educator & CEO Pied Piper
                  </p>
                  <p className="text-base font-light text-gray-500 ">
                    <time dateTime="2022-02-08" title="February 8th, 2022">
                      {formatDateToCustomFormat(data.createdAt)}
                    </time>
                  </p>
                </div>
              </div>
            </address>
            <div>
              {data.tags?.map((tag) => (
                <span
                  key={tag.toString()}
                  className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-3 py-1 rounded "
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <RenderBlogBody blocks={data.blocks} />
        </article>
      </div>
    </main>
  );
};

export default BlogPage;

const RenderBlogBody = ({ blocks }: { blocks: ListBlockChildrenResponse["results"] }) => {
  return (
    <section>
      {blocks.map((block) => (
        <Fragment key={block.id}>{renderBlock(block)}</Fragment>
      ))}
    </section>
  );
};
