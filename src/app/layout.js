import "./globals.css";
import { SOPProvider } from "@/context/SOPContext";
import Layout from "@/components/Layout";

export const metadata = {
  title: "S&OP Planner",
  description: "Sales and Operations Planning MVP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SOPProvider>
          <Layout>{children}</Layout>
        </SOPProvider>
      </body>
    </html>
  );
}
