import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Property } from "../types";
import { useI18n } from "../i18n";
import { useCurrency } from "../context/CurrencyContext";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const YEREVAN: [number, number] = [40.1792, 44.515];

interface Props {
  properties: Property[];
  onSelect?: (id: string) => void;
}

export default function PropertyMap({ properties, onSelect }: Props) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const withCoords = properties.filter((p) => p.latitude && p.longitude);

  return (
    <div className="h-[500px] overflow-hidden rounded-2xl border border-white/10">
      <MapContainer center={YEREVAN} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; CartoDB'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {withCoords.map((p) => (
          <Marker
            key={p.id}
            position={[Number(p.latitude), Number(p.longitude)]}
            eventHandlers={{ click: () => onSelect?.(p.id) }}
          >
            <Popup>
              <span className="font-mono text-sm">
                {p.rooms} {t("roomUnit")} · {formatPrice(p.current_price_usd)}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
