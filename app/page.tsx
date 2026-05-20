/**
 * Root landing page wrapper.
 *
 * The campaign site itself lives in /public/index.html, so we render it in an iframe
 * from the actual Next.js entrypoint to avoid serving the raw file directly.
 */
export default function Home() {
  return (
    <main style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="/index.html"
        title="Emploid landing page"
        style={{
          display: 'block',
          width: '100%',
          height: '100vh',
          border: 0,
        }}
      />
    </main>
  );
}
