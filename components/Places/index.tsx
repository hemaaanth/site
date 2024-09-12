import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaUtensils, FaGlassMartini, FaLandmark, FaStore, FaBed, FaCoffee, FaBriefcase, FaBeer } from 'react-icons/fa';

type PlaceType = 'food' | 'drink' | 'activity' | 'sight' | 'store' | 'hotel' | 'coffee' | 'work' | 'party';

interface PlaceItemProps {
    title: string;
    location: string;
    googleMapsUrl: string;
    type: PlaceType;
    description: string;
    image?: string;
    icon: string;
  }

const typeIcons = {
  food: FaUtensils,
  drink: FaGlassMartini,
  activity: FaLandmark,
  sight: FaLandmark,
  store: FaStore,
  hotel: FaBed,
  coffee: FaCoffee,
  work: FaBriefcase,
  party: FaBeer,
};

const PlaceItem: React.FC<PlaceItemProps> = ({
title,
location,
googleMapsUrl,
icon,
description,
image,
}) => {
    const Icon = typeIcons[icon] || FaLandmark;

return (
    <div className="mb-8">
    <div className="flex items-center mb-2">
        <Icon className="mr-2 text-neutral-500" />
        <h3 className="font-semibold">{title}</h3>
    </div>
    <div className="flex items-center text-sm text-neutral-500 mb-2">
        <a href={googleMapsUrl} target="_blank" className="hover:underline">
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