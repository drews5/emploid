// Emploid — About page
const AboutPage = () => (
  <section className="page active">
    <div className="container about-shell">
      <div className="about-hero">
        <p className="section-kicker">Our story</p>
        <h1 className="about-headline">Built by students who got tired of applying to jobs that didn't exist.</h1>
        <p className="about-lede">We're a team out of the Carlson School of Management who watched classmates send hundreds of applications into the void. Emploid started as a class project — and turned into a real tool for real job seekers.</p>
      </div>

      <div className="about-grid">
        <div className="about-block">
          <h3>The problem</h3>
          <p>Over 40% of online job postings are "ghost jobs" — listings that aren't really hiring. Companies leave them up to look like they're growing, or recruiters use them to build candidate pipelines. Either way, you waste hours applying to roles that will never close.</p>
        </div>
        <div className="about-block">
          <h3>Our approach</h3>
          <p>We aggregate postings from six major job boards and thousands of company career pages. Every listing gets a Listing Trust Score based on posting age, repost frequency, salary transparency, and hiring activity. Low signal? We tell you. High signal? Apply with confidence.</p>
        </div>
        <div className="about-block">
          <h3>The direct link promise</h3>
          <p>Every apply button on Emploid points straight to the employer's own career site. No middlemen, no intake forms, no resume-farming. We make no money off your application. We're just trying to make the search honest again.</p>
        </div>
      </div>

      <div className="about-cta">
        <h2>Join the early access waitlist.</h2>
        <p>We're onboarding new users in waves as we expand our index.</p>
        <div className="about-cta-form">
          <input className="input" type="email" placeholder="you@school.edu" />
          <button className="btn btn-primary">Request Access</button>
        </div>
      </div>
    </div>
  </section>
);
window.AboutPage = AboutPage;
