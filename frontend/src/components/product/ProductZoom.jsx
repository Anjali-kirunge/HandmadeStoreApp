import { useState, useRef, useCallback } from 'react';
import { Image } from 'react-bootstrap';

const ZOOM_FACTOR = 2.5;

const ProductZoom = ({ images = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const containerRef = useRef(null);

  const currentImage = images[selectedIndex] || 'https://placehold.co/500x500/EEE/999?text=No+Image';

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, []);

  const handleMouseEnter = () => setIsZooming(true);
  const handleMouseLeave = () => setIsZooming(false);

  if (images.length === 0) {
    return (
      <div className="text-center p-5 bg-light rounded">
        <Image src="https://placehold.co/500x500/EEE/999?text=No+Image" fluid rounded />
      </div>
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="position-relative rounded overflow-hidden border"
        style={{ cursor: 'crosshair', maxHeight: '500px' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={currentImage}
          alt={`Product view ${selectedIndex + 1}`}
          fluid
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        {isZooming && (
          <div
            className="position-absolute border rounded shadow"
            style={{
              top: 0,
              left: '105%',
              width: '400px',
              height: '400px',
              overflow: 'hidden',
              zIndex: 10,
              backgroundColor: '#fff',
              backgroundImage: `url(${currentImage})`,
              backgroundSize: `${ZOOM_FACTOR * 100}%`,
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              display: 'none',
            }}
          >
            <style>{`
              @media (min-width: 992px) {
                .zoom-panel { display: block !important; }
              }
            `}</style>
            <div
              className="zoom-panel"
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${currentImage})`,
                backgroundSize: `${ZOOM_FACTOR * 100}%`,
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              }}
            />
          </div>
        )}

        <div
          className="position-absolute zoom-lens"
          style={{
            width: `${100 / ZOOM_FACTOR}%`,
            height: `${100 / ZOOM_FACTOR}%`,
            left: `calc(${zoomPosition.x}% - ${50 / ZOOM_FACTOR}%)`,
            top: `calc(${zoomPosition.y}% - ${50 / ZOOM_FACTOR}%)`,
            border: '2px solid rgba(0,0,0,0.2)',
            backgroundColor: 'rgba(255,255,255,0.1)',
            pointerEvents: 'none',
            display: isZooming ? 'block' : 'none',
          }}
        />
      </div>

      {isZooming && (
        <div
          className="d-none d-lg-block position-fixed border rounded shadow bg-white p-2"
          style={{
            top: '50%',
            right: '2%',
            transform: 'translateY(-50%)',
            width: '400px',
            height: '400px',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${currentImage})`,
              backgroundSize: `${ZOOM_FACTOR * 100}%`,
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
            }}
          />
        </div>
      )}

      {images.length > 1 && (
        <div className="d-flex gap-2 mt-3 flex-wrap">
          {images.map((img, index) => (
            <div
              key={index}
              onClick={() => setSelectedIndex(index)}
              className="border rounded overflow-hidden"
              style={{
                width: '70px',
                height: '70px',
                cursor: 'pointer',
                border: index === selectedIndex ? '3px solid var(--brand)' : '2px solid var(--border-color)',
                opacity: index === selectedIndex ? 1 : 0.7,
                transition: 'all 0.2s',
              }}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductZoom;
