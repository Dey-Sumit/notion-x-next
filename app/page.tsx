// @ts-nocheck - may need to be at the start of file
import Image from "next/image";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import BlogCard, { BlogCardProps } from "~/components/BlogCard";
import notionClient from "~/utils/notionClient";

async function getBlogList() {
  /*   const res = await notion.databases.retrieve({
    database_id: process.env.NOTION_BLOG_DATABASE_ID!,
  });
  return res; */

  const res = await notionClient.databases.query({
    database_id: process.env.NOTION_BLOG_DATABASE_ID!,
  });

  const blogList: Array<BlogCardProps> = res.results.map((_item) => {
    const item = _item as PageObjectResponse;
    return {
      id: item.id,
      title: item.properties.Name?.title[0].plain_text,
      description: "",
      coverImageUrl: item.cover?.external?.url || "https://source.unsplash.com/random/1920x1080/?wallpaper",
      tags: item.properties.Tags?.multi_select.map((tag) => tag.name),
    };
  });

  return blogList;
}

export default async function Home() {
  const blogList = await getBlogList();

  return (
    <main className=" min-h-screen p-24">
      <div className="grid grid-cols-6 md:grid-cols-6 gap-8  ">
        {blogList.map((item, index) => (
          <BlogCard key={index} {...item} />
        ))}
      </div>
    </main>
  );
}
