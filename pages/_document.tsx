import Document, { Head, Html, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/logo.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
          <meta
            name="description"
            content="Translate human language to SQL queries in seconds."
          />
          <meta property="og:site_name" content="SQL Translator" />
          <meta
            property="og:description"
            content="Translate human language to SQL queries in seconds."
          />
          <meta property="og:title" content="SQL Translator" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="SQL Translator" />
          <meta
            name="twitter:description"
            content="Translate human language to SQL queries in seconds."
          />
        </Head>
        <body className="dark:bg-black bg-gray-100 text-gray-800 dark:text-white font-sans transition-colors">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
