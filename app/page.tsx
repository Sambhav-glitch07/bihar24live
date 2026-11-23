import NewsHome from "@/components/NewsHome";
export const revalidate = 60;
export default function HomePage() { return <NewsHome language="hi" />; }
