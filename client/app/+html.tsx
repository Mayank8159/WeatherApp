import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {/* viewport-fit=cover is key for mobile notched devices */}
        <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
        <ScrollViewStyleReset />
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            /* Changed from #000 to transparent to let our Image component show */
            background: transparent; 
            overflow: hidden;
            position: fixed; /* Prevents accidental bounce scrolling on web/iOS */
          }
          #root {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: transparent;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}