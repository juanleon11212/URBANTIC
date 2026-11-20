import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../ui/Icon.jsx';

function createLocationPopup(report) {
  const wrapper = document.createElement('div');
  const title = document.createElement('strong');
  const detail = document.createElement('span');
  wrapper.className = 'map-popup';
  title.textContent = report.location || 'Ubicación del reporte';
  detail.textContent = report.zone || 'Punto indicado por el ciudadano';
  wrapper.append(title, detail);
  return wrapper;
}

export default function ReportLocationMap({ report }) {
  const containerRef = useRef(null);
  const latitude = Number(report.latitude);
  const longitude = Number(report.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const directionsUrl = useMemo(() => {
    if (!hasCoordinates) return '';
    const destination = encodeURIComponent(`${latitude},${longitude}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }, [hasCoordinates, latitude, longitude]);

  useEffect(() => {
    if (!hasCoordinates || !containerRef.current) return undefined;

    const coordinates = [latitude, longitude];
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true })
      .setView(coordinates, 17);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.circleMarker(coordinates, {
      radius: 10,
      color: '#ffffff',
      weight: 3,
      fillColor: '#dc4a3d',
      fillOpacity: 1
    }).addTo(map).bindPopup(createLocationPopup(report)).openPopup();

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 0);
    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
    };
  }, [hasCoordinates, latitude, longitude, report.location, report.zone]);

  return (
    <section className="technician-location-section">
      <div className="section-heading technician-location-heading">
        <div><span className="eyebrow">Guía de llegada</span><h2>Ubicación del reporte</h2></div>
        {directionsUrl && (
          <a className="button button-outline button-small" href={directionsUrl} target="_blank" rel="noreferrer">
            <Icon name="pin" size={16} /> Cómo llegar
          </a>
        )}
      </div>

      {hasCoordinates ? (
        <>
          <div className="technician-location-map" ref={containerRef} aria-label={`Mapa de ${report.location || 'la ubicación del reporte'}`} />
          <div className="technician-location-address">
            <Icon name="pin" size={18} />
            <div><strong>{report.location || 'Ubicación seleccionada'}</strong><span>{report.zone || 'Sin zona especificada'}</span></div>
          </div>
        </>
      ) : (
        <div className="location-unavailable">
          <Icon name="pin" size={24} />
          <div><strong>{report.location || 'Ubicación sin especificar'}</strong><p>Este reporte no tiene un punto marcado en el mapa.</p></div>
        </div>
      )}
    </section>
  );
}
