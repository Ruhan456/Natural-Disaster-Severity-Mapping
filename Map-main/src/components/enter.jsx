import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FileIcon } from 'lucide-react';

const DisasterFormWithMap = () => {
  const [formData, setFormData] = useState({
    disasterType: '',
    picture: null,
    location: null,
  });
  const [response, setResponse] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [locationError, setLocationError] = useState('');
  const username = location.state?.username;

  useEffect(() => {
    // Replace with your actual Mapbox token
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXVta2FybWFsaSIsImEiOiJjbTNydmViNWYwMDEwMnJwdnhra3lqcTdiIn0.uENwb1XNsjEY1Y9DUWwslw';

    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            initMap(longitude, latitude);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationError('Unable to retrieve your location.');
            initMap(-122.4194, 37.7749); // Default to San Francisco
          }
        );
      } else {
        setLocationError('Geolocation is not supported by this browser.');
        initMap(-122.4194, 37.7749);
      }
    };

    const initMap = (longitude, latitude) => {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [longitude, latitude],
        zoom: 12,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true
        })
      );

      // Handle map click for selecting location
      map.on('click', (event) => {
        const { lng, lat } = event.lngLat;
        setFormData((prev) => ({
          ...prev,
          location: [lng, lat],
        }));

        // Remove existing marker if present
        if (markerRef.current) {
          markerRef.current.remove();
        }

        // Add new marker
        const marker = new mapboxgl.Marker({ 
          color: 'red', 
          draggable: true 
        })
          .setLngLat([lng, lat])
          .addTo(map);

        // Allow marker to be dragged for precise location
        marker.on('dragend', () => {
          const newLocation = marker.getLngLat();
          setFormData((prev) => ({
            ...prev,
            location: [newLocation.lng, newLocation.lat],
          }));
        });

        markerRef.current = marker;
      });

      return map;
    };

    getCurrentLocation();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const handleChange = (e) => {
    if (e.target.name === 'picture') {
      setFormData({
        ...formData,
        picture: e.target.files[0],
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.disasterType && formData.picture && formData.location) {
      const formDataToSend = new FormData();
      formDataToSend.append('image', formData.picture);
      formDataToSend.append('location', JSON.stringify(formData.location));
      formDataToSend.append('disasterType', formData.disasterType);

      try {
        const res = await fetch('http://127.0.0.1:5000/predict', {
          method: 'POST',
          body: formDataToSend,
        });

        if (!res.ok) {
          throw new Error('Failed to fetch from Flask app');
        }

        const data = await res.json();
        setResponse(data);
        
        // Navigate to /p after successful submission
        navigate('/main', { 
          state: { 
            disasterType: formData.disasterType, 
            location: formData.location,
            prediction: data.predicted_class,
            username: username
          } 
        });
        
      } catch (error) {
        console.error('Error:', error);
        setResponse({ error: 'Failed to send the data to the server.' });
      }
    } else {
      alert('Please select a disaster type, upload a valid .jpg file, and select a location on the map.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-black">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-lg shadow-xl border border-gray-800 mb-8">
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-bold text-center text-white">Report a Natural Disaster</h1>
          <p className="text-center text-gray-400">
            {formData.location 
              ? `Location Selected: ${formData.location[0].toFixed(4)}, ${formData.location[1].toFixed(4)}` 
              : 'Select the disaster type, upload a picture, and click on the map to choose a location.'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Disaster Type Dropdown */}
          <div className="relative">
            <select
              name="disasterType"
              value={formData.disasterType}
              onChange={handleChange}
              className="w-full py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
              required
            >
              <option value="" disabled>Select a Natural Disaster</option>
              <option value="earthquake">Earthquake</option>
              <option value="flood">Flood</option>
              <option value="tsunami">Tsunami</option>
            </select>
          </div>

          {/* File Upload for Picture */}
          <div className="relative">
            <FileIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="file"
              name="picture"
              accept=".jpg,.jpeg"
              onChange={handleChange}
              className="w-full pl-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
              required
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-semibold"
          >
            Submit Report
          </button>
        </form>
      </div>

      {/* Map Container */}
      <div className="w-full h-96 bg-gray-800 border border-gray-700 rounded-lg">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Location Error Message */}
      {locationError && (
        <p className="text-red-500 text-center mt-4">{locationError}</p>
      )}
    </div>
  );
};

export default DisasterFormWithMap;