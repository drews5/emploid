export default function NotFoundPage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>404</div>
        <h1 style={styles.title}>This page doesn&apos;t exist — unlike our job listings.</h1>
        <p style={styles.body}>
          Head back to Emploid and we&apos;ll get you to the roles that are actually hiring.
        </p>
        <a href="/" style={styles.link}>
          Back to search
        </a>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    background: '#f5f7fb',
    color: '#223247',
    fontFamily: 'Satoshi, sans-serif',
  },
  card: {
    width: 'min(100%, 720px)',
    padding: '40px',
    borderRadius: '18px',
    background: '#ffffff',
    border: '1px solid #bcc9d8',
    boxShadow: '0 18px 40px rgba(8, 17, 31, 0.08)',
  },
  kicker: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#c85b24',
    marginBottom: '14px',
  },
  title: {
    margin: 0,
    fontFamily: '"Filson Pro", sans-serif',
    fontSize: 'clamp(2rem, 4vw, 3.25rem)',
    lineHeight: 1.02,
    letterSpacing: '-0.03em',
    color: '#0d1726',
  },
  body: {
    marginTop: '16px',
    marginBottom: '24px',
    fontSize: '16px',
    lineHeight: 1.6,
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: '0 18px',
    borderRadius: '999px',
    background: '#c85b24',
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'none',
  },
};
