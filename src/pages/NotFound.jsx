import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="container">
      <h1>404 - Page Not Found</h1>
      <Link to="/" className="btn">
        Return Home
      </Link>
    </section>
  );
}

export default NotFound;
