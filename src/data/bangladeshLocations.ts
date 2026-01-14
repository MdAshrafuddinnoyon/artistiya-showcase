// Bangladesh Divisions, Districts, and Thanas/Upazilas

export interface Thana {
  name: string;
  name_bn: string;
}

export interface District {
  name: string;
  name_bn: string;
  thanas: Thana[];
}

export interface Division {
  name: string;
  name_bn: string;
  districts: District[];
}

export const divisions: Division[] = [
  {
    name: "Dhaka",
    name_bn: "ঢাকা",
    districts: [
      {
        name: "Dhaka",
        name_bn: "ঢাকা",
        thanas: [
          { name: "Dhanmondi", name_bn: "ধানমন্ডি" },
          { name: "Gulshan", name_bn: "গুলশান" },
          { name: "Mirpur", name_bn: "মিরপুর" },
          { name: "Mohammadpur", name_bn: "মোহাম্মদপুর" },
          { name: "Uttara", name_bn: "উত্তরা" },
          { name: "Banani", name_bn: "বনানী" },
          { name: "Tejgaon", name_bn: "তেজগাঁও" },
          { name: "Motijheel", name_bn: "মতিঝিল" },
          { name: "Lalbagh", name_bn: "লালবাগ" },
          { name: "Ramna", name_bn: "রমনা" },
        ],
      },
      {
        name: "Gazipur",
        name_bn: "গাজীপুর",
        thanas: [
          { name: "Gazipur Sadar", name_bn: "গাজীপুর সদর" },
          { name: "Kaliakair", name_bn: "কালিয়াকৈর" },
          { name: "Kapasia", name_bn: "কাপাসিয়া" },
          { name: "Sreepur", name_bn: "শ্রীপুর" },
          { name: "Tongi", name_bn: "টঙ্গী" },
        ],
      },
      {
        name: "Narayanganj",
        name_bn: "নারায়ণগঞ্জ",
        thanas: [
          { name: "Narayanganj Sadar", name_bn: "নারায়ণগঞ্জ সদর" },
          { name: "Araihazar", name_bn: "আড়াইহাজার" },
          { name: "Bandar", name_bn: "বন্দর" },
          { name: "Rupganj", name_bn: "রূপগঞ্জ" },
          { name: "Sonargaon", name_bn: "সোনারগাঁও" },
        ],
      },
    ],
  },
  {
    name: "Chittagong",
    name_bn: "চট্টগ্রাম",
    districts: [
      {
        name: "Chittagong",
        name_bn: "চট্টগ্রাম",
        thanas: [
          { name: "Chittagong Sadar", name_bn: "চট্টগ্রাম সদর" },
          { name: "Agrabad", name_bn: "আগ্রাবাদ" },
          { name: "Nasirabad", name_bn: "নাসিরাবাদ" },
          { name: "Panchlaish", name_bn: "পাঁচলাইশ" },
          { name: "Kotwali", name_bn: "কোতোয়ালি" },
        ],
      },
      {
        name: "Cox's Bazar",
        name_bn: "কক্সবাজার",
        thanas: [
          { name: "Cox's Bazar Sadar", name_bn: "কক্সবাজার সদর" },
          { name: "Teknaf", name_bn: "টেকনাফ" },
          { name: "Ukhiya", name_bn: "উখিয়া" },
          { name: "Ramu", name_bn: "রামু" },
        ],
      },
    ],
  },
  {
    name: "Rajshahi",
    name_bn: "রাজশাহী",
    districts: [
      {
        name: "Rajshahi",
        name_bn: "রাজশাহী",
        thanas: [
          { name: "Rajshahi Sadar", name_bn: "রাজশাহী সদর" },
          { name: "Boalia", name_bn: "বোয়ালিয়া" },
          { name: "Rajpara", name_bn: "রাজপাড়া" },
          { name: "Motihar", name_bn: "মতিহার" },
        ],
      },
      {
        name: "Bogra",
        name_bn: "বগুড়া",
        thanas: [
          { name: "Bogra Sadar", name_bn: "বগুড়া সদর" },
          { name: "Sherpur", name_bn: "শেরপুর" },
          { name: "Shibganj", name_bn: "শিবগঞ্জ" },
        ],
      },
    ],
  },
  {
    name: "Khulna",
    name_bn: "খুলনা",
    districts: [
      {
        name: "Khulna",
        name_bn: "খুলনা",
        thanas: [
          { name: "Khulna Sadar", name_bn: "খুলনা সদর" },
          { name: "Sonadanga", name_bn: "সোনাডাঙ্গা" },
          { name: "Khalishpur", name_bn: "খালিশপুর" },
        ],
      },
      {
        name: "Jessore",
        name_bn: "যশোর",
        thanas: [
          { name: "Jessore Sadar", name_bn: "যশোর সদর" },
          { name: "Benapole", name_bn: "বেনাপোল" },
          { name: "Jhikargacha", name_bn: "ঝিকরগাছা" },
        ],
      },
    ],
  },
  {
    name: "Sylhet",
    name_bn: "সিলেট",
    districts: [
      {
        name: "Sylhet",
        name_bn: "সিলেট",
        thanas: [
          { name: "Sylhet Sadar", name_bn: "সিলেট সদর" },
          { name: "Kotwali", name_bn: "কোতোয়ালি" },
          { name: "Jalalabad", name_bn: "জালালাবাদ" },
          { name: "Moglabazar", name_bn: "মোগলাবাজার" },
        ],
      },
      {
        name: "Sunamganj",
        name_bn: "সুনামগঞ্জ",
        thanas: [
          { name: "Sunamganj Sadar", name_bn: "সুনামগঞ্জ সদর" },
          { name: "Tahirpur", name_bn: "তাহিরপুর" },
        ],
      },
    ],
  },
  {
    name: "Barisal",
    name_bn: "বরিশাল",
    districts: [
      {
        name: "Barisal",
        name_bn: "বরিশাল",
        thanas: [
          { name: "Barisal Sadar", name_bn: "বরিশাল সদর" },
          { name: "Kotwali", name_bn: "কোতোয়ালি" },
          { name: "Kawnia", name_bn: "কাউনিয়া" },
        ],
      },
      {
        name: "Patuakhali",
        name_bn: "পটুয়াখালী",
        thanas: [
          { name: "Patuakhali Sadar", name_bn: "পটুয়াখালী সদর" },
          { name: "Kuakata", name_bn: "কুয়াকাটা" },
        ],
      },
    ],
  },
  {
    name: "Rangpur",
    name_bn: "রংপুর",
    districts: [
      {
        name: "Rangpur",
        name_bn: "রংপুর",
        thanas: [
          { name: "Rangpur Sadar", name_bn: "রংপুর সদর" },
          { name: "Kotwali", name_bn: "কোতোয়ালি" },
          { name: "Mithapukur", name_bn: "মিঠাপুকুর" },
        ],
      },
      {
        name: "Dinajpur",
        name_bn: "দিনাজপুর",
        thanas: [
          { name: "Dinajpur Sadar", name_bn: "দিনাজপুর সদর" },
          { name: "Birampur", name_bn: "বিরামপুর" },
        ],
      },
    ],
  },
  {
    name: "Mymensingh",
    name_bn: "ময়মনসিংহ",
    districts: [
      {
        name: "Mymensingh",
        name_bn: "ময়মনসিংহ",
        thanas: [
          { name: "Mymensingh Sadar", name_bn: "ময়মনসিংহ সদর" },
          { name: "Kotwali", name_bn: "কোতোয়ালি" },
          { name: "Trishal", name_bn: "ত্রিশাল" },
        ],
      },
      {
        name: "Jamalpur",
        name_bn: "জামালপুর",
        thanas: [
          { name: "Jamalpur Sadar", name_bn: "জামালপুর সদর" },
          { name: "Islampur", name_bn: "ইসলামপুর" },
        ],
      },
    ],
  },
];

// Helper function to check if district is in Dhaka division
export const isDhakaDistrict = (districtName: string): boolean => {
  const dhakaDistricts = ["Dhaka", "Gazipur", "Narayanganj", "Manikganj", "Munshiganj", "Narsingdi", "Tangail"];
  return dhakaDistricts.includes(districtName);
};

// Shipping cost calculation
export const calculateShippingCost = (districtName: string): number => {
  return isDhakaDistrict(districtName) ? 80 : 130;
};
