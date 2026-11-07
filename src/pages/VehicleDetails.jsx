import { useParams, Link } from "react-router-dom";

function VehicleDetails() {
  const { id } = useParams();

  return (
    <section className="container">
      <h1>Vehicle Details</h1>
      <p>Vehicle ID: {id}</p>

      <Link to="/book-service" className="btn">
        Book a Service
      </Link>
    </section>
  );
}

export default VehicleDetails;
