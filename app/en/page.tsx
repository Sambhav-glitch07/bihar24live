import NewsHome from "@/components/NewsHome";
export const revalidate = 60;
export default function EnglishHomePage() { return <NewsHome language="en" />; }
