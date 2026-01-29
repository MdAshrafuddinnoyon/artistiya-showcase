// Bangladesh Complete Divisions, Districts, and Thanas/Upazilas
// Parsed from official postal data

export interface Location {
  code: number;
  name: string;
  station: string;
  district: string;
  division: string;
}

export interface Division {
  name: string;
  districts: string[];
}

export interface DistrictData {
  name: string;
  division: string;
  thanas: string[];
}

// All divisions with their districts
export const divisions: Division[] = [
  {
    name: "Dhaka",
    districts: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"]
  },
  {
    name: "Chattogram",
    districts: ["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Comilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"]
  },
  {
    name: "Rajshahi",
    districts: ["Bogura", "Chapai Nawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna", "Rajshahi", "Sirajganj"]
  },
  {
    name: "Khulna",
    districts: ["Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"]
  },
  {
    name: "Sylhet",
    districts: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"]
  },
  {
    name: "Barishal",
    districts: ["Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"]
  },
  {
    name: "Rangpur",
    districts: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"]
  },
  {
    name: "Mymensingh",
    districts: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"]
  }
];

// Districts with their thanas (parsed from CSV)
export const districtThanas: Record<string, string[]> = {
  // Dhaka Division
  "Dhaka": [
    "Demra", "Dhaka Cantt.", "Dhamrai", "Dhanmondi", "Gulshan", "Jatrabari", "Joypara",
    "Keraniganj", "Khilgaon", "Khilkhet", "Lalbag", "Mirpur", "Mohammadpur", "Motijheel",
    "Nawabganj", "New market", "Palton", "Ramna", "Sabujbag", "Savar", "Sutrapur", "Tejgaon",
    "Tejgaon Industrial Area", "Uttara"
  ],
  "Faridpur": [
    "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Faridpur Sadar", "Madukhali",
    "Nagarkanda", "Sadarpur"
  ],
  "Gazipur": [
    "Gazipur Sadar", "Kaliakaar", "Kaliganj", "Kapashia", "Monnunagar", "Sreepur"
  ],
  "Gopalganj": [
    "Gopalganj Sadar", "Kashiani", "Kotalipara", "Maksudpur", "Tungipara"
  ],
  "Kishoreganj": [
    "Bajitpur", "Bhairob", "Hossenpur", "Itna", "Karimganj", "Katiadi", "Kishoreganj Sadar",
    "Kuliarchar", "Mithamoin", "Nikli", "Ostagram", "Pakundia", "Tarial"
  ],
  "Madaripur": [
    "Barhamganj", "kalkini", "Madaripur Sadar", "Rajoir"
  ],
  "Manikganj": [
    "Doulatpur", "Gheor", "Lechhraganj", "Manikganj Sadar", "Saturia", "Shibloya", "Singari"
  ],
  "Munshiganj": [
    "Gajaria", "Lohajong", "Munshiganj Sadar", "Sirajdikhan", "Srinagar", "Tangibari"
  ],
  "Narayanganj": [
    "Araihazar", "Baidder Bazar", "Bandar", "Fatullah", "Narayanganj Sadar", "Rupganj", "Siddirganj"
  ],
  "Narsingdi": [
    "Belabo", "Monohordi", "Narshingdi Sadar", "Palash", "Raypura", "Shibpur"
  ],
  "Rajbari": [
    "Baliakandi", "Pangsha", "Rajbari Sadar"
  ],
  "Shariatpur": [
    "Bhedorganj", "Damudhya", "Gosairhat", "Jajira", "Naria", "Shariatpur Sadar"
  ],
  "Tangail": [
    "Basail", "Bhuapur", "Delduar", "Ghatail", "Gopalpur", "Kalihati", "Kashkaolia",
    "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar"
  ],
  
  // Chattogram Division
  "Bandarban": [
    "Alikadam", "Bandarban Sadar", "Naikhong", "Roanchhari", "Ruma", "Thanchi"
  ],
  "Brahmanbaria": [
    "Akhaura", "Banchharampur", "Brahamanbaria Sadar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"
  ],
  "Chandpur": [
    "Chandpur Sadar", "Faridganj", "Hajiganj", "Hayemchar", "Kachua", "Matlobganj", "Shahrasti"
  ],
  "Chattogram": [
    "Akbar Shah", "Anawara", "Boalkhali", "Chittagong Sadar", "East Joara", "Fatikchhari", 
    "Hathazari", "Khulshi", "Lohagara", "Mirsharai", "Pahartali", "Patiya", "Rangunia", 
    "Raozan", "Sandwip", "Satkania", "Sitakunda"
  ],
  "Comilla": [
    "Barura", "Brahmanpara", "Burichang", "Chandina", "Chouddogram", "Comilla Sadar",
    "Daudkandi", "Debidwar", "Homna", "Lacham", "Laksam", "Meghna", "Muradnagar", "Nangalkot", "Titas"
  ],
  "Cox's Bazar": [
    "Chiringga", "Coxs Bazar Sadar", "Gorakghat", "Kutubdia", "Ramu", "Teknaf", "Ukhia"
  ],
  "Feni": [
    "Chhagalnaia", "Dagonbhuia", "Feni Sadar", "Pashurampur", "Sonagazi"
  ],
  "Khagrachhari": [
    "Diginala", "Khagrachari Sadar", "Laxmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramghar Head Office"
  ],
  "Lakshmipur": [
    "Char Alexgander", "Lakshimpur Sadar", "Ramganj", "Raypur"
  ],
  "Noakhali": [
    "Basurhat", "Begumganj", "Chatkhil", "Hatiya", "Noakhali Sadar", "Senbag"
  ],
  "Rangamati": [
    "Barakal", "Bilaichhari", "Jarachhari", "Kalampati", "Kaptai", "Longachh", "Marishya", "Naniachhar", "Rajsthali", "Rangamati Sadar"
  ],

  // Rajshahi Division
  "Bogura": [
    "Alamdighi", "Bogura Sadar", "Dhunat", "Dupchachia", "Gabtoli", "Kahalu", "Nandigram", "Sariakandi", "Sherpur", "Shibganj", "Sonatola"
  ],
  "Joypurhat": [
    "Akkelpur", "Joypurhat Sadar", "Kalai", "Khetlal", "Panchbibi"
  ],
  "Naogaon": [
    "Ahsanganj", "Badalgachhi", "Dhamuirhat", "Mahadebpur", "Naogaon Sadar", "Niamatpur", "Nitpur", "Patnitala", "Prasadpur", "Raninagar", "Sapahar"
  ],
  "Natore": [
    "Gopalpur UPO", "Harua", "Hatgurudaspur", "Laxman", "Natore Sadar", "Singra"
  ],
  "Chapai Nawabganj": [
    "Bholahat", "Chapinawabganj Sadar", "Nachol", "Rohanpur", "Shibganj U.P.O"
  ],
  "Pabna": [
    "Banwarinagar", "Bera", "Bhangura", "Chatmohar", "Debottar", "Ishwardi", "Pabna Sadar", "Sathia", "Sujanagar"
  ],
  "Rajshahi": [
    "Bagha", "Bhabaniganj", "Charghat", "Durgapur", "Godagari", "Khod Mohanpur", "Lalitganj", "Putia", "Rajshahi Sadar", "Tanor"
  ],
  "Sirajganj": [
    "Baiddya Jam Toil", "Belkuchi", "Dhangora", "Kazipur", "Shahjadpur", "Sirajganj Sadar", "Tarash", "Ullapara"
  ],

  // Khulna Division
  "Bagerhat": [
    "Bagerhat Sadar", "Chalna Ankorage", "Chitalmari", "Fakirhat", "Kachua UPO", "Mollahat", "Morelganj", "Rampal", "Rayenda"
  ],
  "Chuadanga": [
    "Alamdanga", "Chuadanga Sadar", "Damurhuda", "Doulatganj"
  ],
  "Jashore": [
    "Bagharpara", "Chaugachha", "Jashore Sadar", "Jhikargachha", "Keshabpur", "Monirampur", "Noapara", "Sarsa"
  ],
  "Jhenaidah": [
    "Harinakundu", "Jinaidaha Sadar", "Kotchandpur", "Maheshpur", "Naldanga", "Shailakupa"
  ],
  "Khulna": [
    "Alaipur", "Batiaghat", "Chalna Bazar", "Digalia", "Khulna Sadar", "Madinabad", "Paikgachha", "Phultala", "Sajiara", "Terakhada"
  ],
  "Kushtia": [
    "Bheramara", "Janipur", "Kumarkhali", "Kustia Sadar", "Mirpur", "Rafayetpur"
  ],
  "Magura": [
    "Arpara", "Magura Sadar", "Mohammadpur", "Shripur"
  ],
  "Meherpur": [
    "Gangni", "Meherpur Sadar", "Mujib Nagar"
  ],
  "Narail": [
    "Kalia", "Lohagara", "Narail Sadar"
  ],
  "Satkhira": [
    "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Satkhira Sadar", "Shyamnagar", "Tala"
  ],

  // Sylhet Division
  "Habiganj": [
    "Ajmiriganj", "Bahubal", "Baniachang", "Chunarughat", "Habiganj Sadar", "Lakhai", "Madhabpur", "Nabiganj"
  ],
  "Moulvibazar": [
    "Barlekha", "Juri", "Kamalganj", "Kulaura", "Moulvibazar Sadar", "Rajnagar", "Sreemangal"
  ],
  "Sunamganj": [
    "Bishwambarpur", "Chhatak", "Derai", "Dharampasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Shalla", "Sunamganj Sadar", "Tahirpur"
  ],
  "Sylhet": [
    "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Fenchuganj", "Golabganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmani Nagar", "Sylhet Sadar", "Zakiganj"
  ],

  // Barishal Division
  "Barguna": [
    "Amtali", "Bamna", "Barguna Sadar", "Betagi", "Patharghata", "Taltali"
  ],
  "Barishal": [
    "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Barishal Sadar", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"
  ],
  "Bhola": [
    "Bhola Sadar", "Borhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"
  ],
  "Jhalokati": [
    "Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"
  ],
  "Patuakhali": [
    "Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali"
  ],
  "Pirojpur": [
    "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Pirojpur Sadar", "Zianagar"
  ],

  // Rangpur Division
  "Dinajpur": [
    "Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Dinajpur Sadar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharol", "Khansama", "Nawabganj", "Parbatipur"
  ],
  "Gaibandha": [
    "Fulchhari", "Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"
  ],
  "Kurigram": [
    "Bhurungamari", "Char Rajibpur", "Chilmari", "Kurigram Sadar", "Nageshwari", "Phulbari", "Rajarhat", "Rowmari", "Ulipur"
  ],
  "Lalmonirhat": [
    "Aditmari", "Hatibandha", "Kaliganj", "Lalmonirhat Sadar", "Patgram"
  ],
  "Nilphamari": [
    "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Nilphamari Sadar", "Saidpur"
  ],
  "Panchagarh": [
    "Atwari", "Boda", "Debiganj", "Panchagarh Sadar", "Tetulia"
  ],
  "Rangpur": [
    "Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgacha", "Pirganj", "Rangpur Sadar", "Taraganj"
  ],
  "Thakurgaon": [
    "Baliadangi", "Haripur", "Pirganj", "Ranisankail", "Thakurgaon Sadar"
  ],

  // Mymensingh Division
  "Jamalpur": [
    "Bakshiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj", "Melandah", "Sarishabari"
  ],
  "Mymensingh": [
    "Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Mymensingh Sadar", "Nandail", "Phulpur", "Trishal"
  ],
  "Netrokona": [
    "Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Khaliajuri", "Madan", "Mohanganj", "Netrokona Sadar", "Purbadhala"
  ],
  "Sherpur": [
    "Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sreebardi"
  ]
};

// Get all thanas for a district
export const getThanasByDistrict = (district: string): string[] => {
  return districtThanas[district] || [];
};

// Get all districts for a division
export const getDistrictsByDivision = (divisionName: string): string[] => {
  const division = divisions.find(d => d.name === divisionName);
  return division?.districts || [];
};

// Get division for a district
export const getDivisionByDistrict = (districtName: string): string | null => {
  for (const division of divisions) {
    if (division.districts.includes(districtName)) {
      return division.name;
    }
  }
  return null;
};

// Helper function to check if district is in Dhaka division (for default shipping calc)
export const isDhakaDistrict = (districtName: string): boolean => {
  const dhakaDivision = divisions.find(d => d.name === "Dhaka");
  return dhakaDivision?.districts.includes(districtName) || false;
};

// Default shipping cost calculation (can be overridden by admin settings)
export const calculateShippingCost = (districtName: string, customRates?: Record<string, number>): number => {
  if (customRates && customRates[districtName] !== undefined) {
    return customRates[districtName];
  }
  return isDhakaDistrict(districtName) ? 80 : 130;
};

// Get all division names
export const getAllDivisions = (): string[] => {
  return divisions.map(d => d.name);
};

// Get all district names
export const getAllDistricts = (): string[] => {
  return divisions.flatMap(d => d.districts);
};
