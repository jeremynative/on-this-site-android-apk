(function () {
  const mapboxBasemaps = {
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    road: "mapbox://styles/mapbox/streets-v12",
    outdoors: "mapbox://styles/mapbox/outdoors-v12",
    blank: {
      version: 8,
      glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
      sources: {},
      layers: [{
        id: "blank-background",
        type: "background",
        paint: { "background-color": "#f6f8f3" }
      }]
    }
  };

  const leafletBasemaps = {
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      options: {
        maxZoom: 19,
        attribution: "Tiles © Esri"
      }
    },
    road: {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
      }
    },
    outdoors: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      options: {
        maxZoom: 17,
        attribution: "Map data © OpenStreetMap, SRTM | Map style © OpenTopoMap"
      }
    },
    blank: null
  };

  window.NLI_SHARED_MAP_CONFIG = {
    useLeafletPrimary: true,
    mapboxBasemaps,
    leafletBasemaps,
    leafletView: {
      center: [40.84, -72.78],
      zoom: 9.7,
      minZoom: 7.35,
      maxZoom: 18,
      maxBounds: [[35, -85], [48, -60]],
      maxBoundsViscosity: 0.3
    }
  };
}());
