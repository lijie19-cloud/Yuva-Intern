import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">WELCOME TO AUTO DEALER</p>

        <h1>Your Bike Deserves the Best Care.</h1>

        <p>
          Discover vehicles and book professional two-wheeler servicing with
          ease.
        </p>

        <div className="actions">
          <Link to="/book-service" className="btn">
            Book a Service
          </Link>

          <Link to="/vehicles" className="btn btn-outline">
            Explore Vehicles
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Home;
