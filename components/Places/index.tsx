import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaUtensils, FaGlassMartini, FaLandmark, FaStore, FaBed, FaCoffee, FaBriefcase, FaBeer, FaWineGlassAlt, FaGlassMartiniAlt, FaStar, FaPersonBooth } from 'react-icons/fa';

export type PlaceType = 'food' | 'beer' | 'cocktails' | 'wine' | 'activity' | 'sight' | 'store' | 'hotel' | 'coffee' | 'work' | 'party' | 'landmark' | 'favourite';

interface PlaceItemProps {
    title: string;
    location: string;
    googleMapsUrl: string;
    types: PlaceType[];
    description: string;
    image?: string;
}

const typeIcons = {
  food: FaUtensils,
  beer: FaBeer,
  cocktails: FaGlassMartiniAlt,
  wine: FaWineGlassAlt,
  activity: FaLandmark,
  sight: FaLandmark,
  shop: FaStore,
  hotel: FaBed,
  coffee: FaCoffee,
  work: FaBriefcase,
  party: FaPersonBooth,
  favourite: FaStar,
};

const PlaceItem: React.FC<PlaceItemProps> = ({
    title,
    location,
    googleMapsUrl,
    types = [], // Add default empty array
    description,
    image,
  }) => {
    return (
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <div className="flex gap-2 mr-2">
            {types?.map((type) => { // Add optional chaining
              const Icon = typeIcons[type] || FaLandmark;
              return <Icon key={type} className="text-neutral-500" />;
            })}
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="flex items-center text-sm text-neutral-500 mb-2">
          <a href={googleMapsUrl} target="_blank" className="hover:underline truncate">
            {location}
          </a>
        </div>
        {image && (
          <div className="mb-4">
            <Image src={image} alt={title} width={500} height={300} className="rounded-md" />
          </div>
        )}
        <p className="mb-4">{description}</p>
      </div>
    );
  };

export default PlaceItem;