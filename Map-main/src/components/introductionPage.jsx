import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation, Link } from 'react-router-dom';

const mapStyles = {
  mapContainer: {
    width: '100%',
    height: '100%',
    borderLeft: '1px solid #374151',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }
};

const IntroductionPage = () => {
  const [disasters, setDisasters] = useState([]);
  const [locationError, setLocationError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const location = useLocation();
  const username = location.state?.username;

  mapboxgl.accessToken = 'pk.eyJ1IjoiYXVta2FybWFsaSIsImEiOiJjbTNydmViNWYwMDEwMnJwdnhra3lqcTdiIn0.uENwb1XNsjEY1Y9DUWwslw';

  const fetchDisasters = async () => {
    try {
      const response = await fetch('http://localhost:5000/disasters');
      if (!response.ok) throw new Error('Failed to fetch disasters');
      const data = await response.json();
      setDisasters(data);
    } catch (error) {
      console.error('Error fetching disasters:', error);
    }
  };

  const addDisasterMarkers = () => {
    if (!mapRef.current || !disasters.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers for each disaster
    disasters.forEach((disaster) => {
      if (disaster.location && Array.isArray(disaster.location) && disaster.location.length === 2) {
        const [longitude, latitude] = disaster.location;
        
        const marker = new mapboxgl.Marker({ color: "#FF0000" })
          .setLngLat([longitude, latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div>
                <h3 style="font-weight: bold">${disaster.type}</h3>
                <p><strong>Severity:</strong> ${disaster.category}</p>
                <p>${disaster.description}</p>
              </div>
            `)
          )
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      }
    });
  };

  const initializeMap = (longitude = 0, latitude = 0, zoom = 2) => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [longitude, latitude],
      zoom: zoom,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before adding markers
    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);

      // Add user location marker if available
      if (longitude !== 0 || latitude !== 0) {
        new mapboxgl.Marker({ color: "#60A5FA" })
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText("Your Location"))
          .addTo(map);
      }

      // Add disaster markers if we already have the data
      if (disasters.length > 0) {
        addDisasterMarkers();
      }
    });
  };

  // Initialize map on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          initializeMap(longitude, latitude, 14);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Please ensure location services are enabled.');
          initializeMap();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      initializeMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run only on mount

  // Fetch disasters on mount
  useEffect(() => {
    fetchDisasters();
  }, []); // Run only on mount

  // Update markers when disasters data changes OR when map becomes loaded
  useEffect(() => {
    if (mapLoaded && disasters.length > 0) {
      addDisasterMarkers();
    }
  }, [disasters, mapLoaded]); // Run when either disasters or mapLoaded changes

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="w-1/3 p-8">
        <h1 className="text-3xl font-bold mb-4 text-white">Welcome {username}!</h1>
        <p className="text-lg mb-4 text-gray-300">This is where the content goes.</p>

        <Link to="/ent">
          <button className="bg-white text-gray-900 font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-gray-200 transition duration-200">
            Submit Emergency
          </button>
        </Link>

        {locationError && (
          <p className="text-red-400 mt-2">{locationError}</p>
        )}

        <div className="mt-6 text-gray-300">
          <h2 className="text-xl font-bold">Disaster Information</h2>
          {disasters.length === 0 ? (
            <p>No disaster information available</p>
          ) : (
            <ul>
              {disasters.map((disaster, index) => (
                <li key={index} className="mt-2">
                  <p><strong>Disaster Type:</strong> {disaster.type}</p>
                  <p><strong>Location:</strong> {disaster.location.join(', ')}</p>
                  <p><strong>Severity:</strong> {disaster.category}</p>
                  <p><strong>Description:</strong> {disaster.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="w-2/3 h-screen relative">
        <div
          ref={mapContainerRef}
          style={{
            ...mapStyles.absoluteFill,
            ...mapStyles.mapContainer,
          }}
        />
      </div>
    </div>
  );
};

export default IntroductionPage;