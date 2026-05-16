import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  UtensilsCrossed,
  Beer,
  Martini,
  Wine,
  Landmark,
  Store,
  BedDouble,
  Coffee,
  Briefcase,
  Camera,
  PartyPopper,
  Star,
} from "lucide-react";

export type PlaceType =
  | "food"
  | "beer"
  | "cocktails"
  | "wine"
  | "activity"
  | "sight"
  | "store"
  | "hotel"
  | "coffee"
  | "work"
  | "party"
  | "photo"
  | "landmark";

interface PlaceItemProps {
  title: string;
  location: string;
  googleMapsUrl: string;
  types: PlaceType[];
  description: string;
  image?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const typeIcons = {
  food: UtensilsCrossed,
  beer: Beer,
  cocktails: Martini,
  wine: Wine,
  activity: Landmark,
  sight: Landmark,
  shop: Store,
  hotel: BedDouble,
  coffee: Coffee,
  work: Briefcase,
  party: PartyPopper,
  photo: Camera,
  favourite: Star,
};

const PlaceItem: React.FC<PlaceItemProps> = ({
  title,
  location,
  googleMapsUrl,
  types = [], // Add default empty array
  description,
  image,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      className="mb-8"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex gap-2 ml-2">
            {types?.map((type) => {
              const Icon = typeIcons[type] || Landmark;
              return <Icon key={type} size={16} className="text-neutral-500" />;
            })}
          </div>
        </div>
        <div className="flex items-center text-sm text-neutral-500 mb-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            className="hover:underline truncate"
          >
            {location}
          </a>
        </div>
        {image && (
          <div className="mb-4">
            <Image
              src={image}
              alt={title}
              width={500}
              height={300}
              className="rounded-md"
            />
          </div>
        )}
        <p className="mb-4">{description}</p>
      </div>
    </div>
  );
};

export default PlaceItem;
