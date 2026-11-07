import { Link } from "react-router-dom";

function VehicleListing() {
  return (
    <section className="container">
      <h1>Explore Vehicles</h1>
      <p>Discover our available motorcycles and scooters.</p>

      <Link to="/vehicles/1" className="btn">
        View Sample Vehicle
      </Link>
    </section>
  );
}

export default VehicleListing;
