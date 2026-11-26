import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, CheckCircle2, MapPin } from "lucide-react";
import { centers } from "./data";
import { useBookings } from "./state";
import workshopMotorcycle from "./assets/optimized/Engine Diagnostics.jpg";
import { SectionTitle, ServiceCard } from "./ui";

/** Renders the public home page without loading customer account screens. */
export function Home() {
  const { services: currentServices } = useBookings();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-pill"><span className="green-dot" /> DELHI'S TRUSTED TWO-WHEELER CARE</span>
          <h1>Your ride.<br /><em>Our responsibility.</em></h1>
          <p>Expert care for every kilometre. Book trusted motorcycle and scooter servicing across Delhi, on your schedule.</p>
          <div className="hero-buttons">
            <Link to="/book-service" className="btn primary large">Book a service <ArrowRight size={18} /></Link>
            <Link to="/services" className="btn ghost large">Explore services</Link>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars"><span>A</span><span>R</span><span>K</span><span>+</span></div>
            <div><b>2,400+ happy riders</b><small><span className="stars">★★★★★</span> 4.9/5 average rating</small></div>
          </div>
        </div>
        <div className="hero-image">
          <img src="/hero-service-optimized.jpg" alt="Motorcycle receiving professional service" fetchpriority="high" decoding="async" width="512" height="339" />
          <div className="hero-image-shade" />
          <div className="image-caption"><span>BUILT AROUND YOUR RIDE</span><b>Every journey deserves<br />a better beginning.</b></div>
          <div className="floating-card"><span className="float-icon"><CheckCircle2 /></span><span><b>Expert care, guaranteed</b><small>Certified technicians · Genuine parts</small></span></div>
        </div>
      </section>
      <section className="trust-row">
        <div><b>12+</b><span>Years of expertise</span></div>
        <div><b>18,000+</b><span>Services completed</span></div>
        <div><b>3</b><span>Delhi service centers</span></div>
        <div><b>4.9 <span className="stars">★</span></b><span>Rider satisfaction</span></div>
      </section>
      <section className="section" id="services">
        <SectionTitle eyebrow="CARE FOR EVERY RIDE" title="The right care, right on time">From routine check-ups to the unexpected, our experts have you covered.</SectionTitle>
        <div className="service-grid home-services">{currentServices.slice(0, 3).map((service) => <ServiceCard key={service.id} service={service} />)}</div>
        <div className="center-link"><Link to="/services" className="btn outline">View all services <ArrowRight size={16} /></Link></div>
      </section>
      <section className="how-section"><div className="section how-inner">
        <SectionTitle eyebrow="SIMPLE BY DESIGN" title="Back on the road in 3 steps" />
        <div className="steps">
          <article><span>01</span><h3>Choose your care</h3><p>Tell us what your ride needs. Explore transparent services and pricing.</p></article>
          <article><span>02</span><h3>Pick your time</h3><p>Choose a convenient Delhi service center and appointment slot.</p></article>
          <article><span>03</span><h3>Ride with confidence</h3><p>Our certified technicians take it from here. Track every update.</p></article>
        </div>
      </div></section>
      <section className="section" id="centers">
        <SectionTitle eyebrow="AROUND THE CORNER" title="A better workshop experience">Three convenient locations. One standard of care.</SectionTitle>
        <div className="center-grid">
          {centers.map((center) => (
            <article className="center-card" key={center.id}>
              <div className="center-cover">
                <MapPin size={22} />
                <span>
                  {center.rating} <span className="stars">★</span>
                </span>
              </div>
              <div className="center-body">
                <h3>{center.name}</h3>
                <p className="center-address">
                  <MapPin size={15} aria-hidden="true" />
                  <span>{center.address}</span>
                </p>
                <a
                  className="text-link center-map-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.address)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View location <ArrowRight size={15} />
                </a>
                <span className="center-contact">{center.phone}</span>
                <Link to="/book-service" className="text-link">
                  Book at this center <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="why-section" id="about">
        <div className="why-image"><img src={workshopMotorcycle} alt="Technician caring for a motorcycle" loading="lazy" decoding="async" /></div>
        <div className="why-copy"><span className="eyebrow">THE AUTO DEALER DIFFERENCE</span><h2>Good service is<br />part of the journey.</h2>
          <p>
            Auto Dealer is a Delhi-based two-wheeler service team built to make
            motorcycle and scooter care easier to plan and trust. Riders can
            compare services, choose a nearby workshop, book an appointment and
            keep their maintenance history in one place.
          </p>
          <p>
            Across our Connaught Place, South Delhi and Dwarka centers,
            experienced technicians use genuine parts and explain recommendations
            clearly. From routine servicing to unexpected repairs, we help every
            rider get back on the road with confidence.
          </p>
          <ul><li><Check size={17} /> Certified, experienced technicians</li><li><Check size={17} /> Transparent pricing, no surprises</li><li><Check size={17} /> Digital service history for every ride</li><li><Check size={17} /> Genuine parts with service warranty</li></ul>
          <Link className="text-link" to="/services">Discover our approach <ArrowRight size={15} /></Link>
        </div>
      </section>
      <section className="testimonial"><div className="quote-mark">“</div><p>Finally, a service center that respects my time and explains exactly what my bike needs. Booking was effortless, and the service was even better.</p>
        <div className="quote-by"><span className="avatar">R</span><span><b>Rohan Malhotra</b><small>Royal Enfield rider · South Delhi</small></span></div>
        <div className="quote-stars">★★★★★ <span>4.9 average from 2,400+ riders</span></div>
      </section>
      <section className="reminder"><div><span className="eyebrow">A LITTLE REMINDER GOES A LONG WAY</span><h2>Stay ahead of your next service.</h2><p>Keep your vehicle's health in check with timely, personal service reminders.</p></div>
        <Link to="/register" className="btn white large">Set up my reminders <ArrowRight size={17} /></Link>
      </section>
    </>
  );
}
