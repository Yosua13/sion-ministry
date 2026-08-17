package repository

import (
	"strings"

	"backend/internal/models"
)

type LocationRepository interface {
	GetProvinces(query string) ([]models.Province, error)
	GetCitiesByProvince(provinceNameOrID string, query string) ([]models.LocationCity, error)
}

type locationRepository struct {
	provinces []models.Province
	cities    []models.LocationCity
}

func NewLocationRepository() LocationRepository {
	repo := &locationRepository{}
	repo.initData()
	return repo
}

func (r *locationRepository) GetProvinces(query string) ([]models.Province, error) {
	q := strings.TrimSpace(strings.ToLower(query))
	if q == "" {
		result := make([]models.Province, len(r.provinces))
		copy(result, r.provinces)
		return result, nil
	}

	var filtered []models.Province
	for _, p := range r.provinces {
		if strings.Contains(strings.ToLower(p.Name), q) {
			filtered = append(filtered, p)
		}
	}
	return filtered, nil
}

func (r *locationRepository) GetCitiesByProvince(provinceNameOrID string, query string) ([]models.LocationCity, error) {
	pInput := strings.TrimSpace(strings.ToLower(provinceNameOrID))
	q := strings.TrimSpace(strings.ToLower(query))

	var filtered []models.LocationCity
	for _, c := range r.cities {
		// Match province if specified
		if pInput != "" {
			pNameMatch := strings.EqualFold(c.ProvinceName, pInput) || strings.Contains(strings.ToLower(c.ProvinceName), pInput)
			pIDMatch := strings.EqualFold(c.ProvinceID, pInput)
			if !pNameMatch && !pIDMatch {
				continue
			}
		}

		// Match city query if specified
		if q != "" && !strings.Contains(strings.ToLower(c.Name), q) {
			continue
		}

		filtered = append(filtered, c)
	}

	return filtered, nil
}

func (r *locationRepository) initData() {
	r.provinces = []models.Province{
		{ID: "11", Name: "Aceh"},
		{ID: "12", Name: "Sumatera Utara"},
		{ID: "13", Name: "Sumatera Barat"},
		{ID: "14", Name: "Riau"},
		{ID: "15", Name: "Jambi"},
		{ID: "16", Name: "Sumatera Selatan"},
		{ID: "17", Name: "Bengkulu"},
		{ID: "18", Name: "Lampung"},
		{ID: "19", Name: "Kepulauan Bangka Belitung"},
		{ID: "21", Name: "Kepulauan Riau"},
		{ID: "31", Name: "DKI Jakarta"},
		{ID: "32", Name: "Jawa Barat"},
		{ID: "33", Name: "Jawa Tengah"},
		{ID: "34", Name: "DI Yogyakarta"},
		{ID: "35", Name: "Jawa Timur"},
		{ID: "36", Name: "Banten"},
		{ID: "51", Name: "Bali"},
		{ID: "52", Name: "Nusa Tenggara Barat"},
		{ID: "53", Name: "Nusa Tenggara Timur"},
		{ID: "61", Name: "Kalimantan Barat"},
		{ID: "62", Name: "Kalimantan Tengah"},
		{ID: "63", Name: "Kalimantan Selatan"},
		{ID: "64", Name: "Kalimantan Timur"},
		{ID: "65", Name: "Kalimantan Utara"},
		{ID: "71", Name: "Sulawesi Utara"},
		{ID: "72", Name: "Sulawesi Tengah"},
		{ID: "73", Name: "Sulawesi Selatan"},
		{ID: "74", Name: "Sulawesi Tenggara"},
		{ID: "75", Name: "Gorontalo"},
		{ID: "76", Name: "Sulawesi Barat"},
		{ID: "81", Name: "Maluku"},
		{ID: "82", Name: "Maluku Utara"},
		{ID: "91", Name: "Papua"},
		{ID: "92", Name: "Papua Barat"},
		{ID: "93", Name: "Papua Selatan"},
		{ID: "94", Name: "Papua Tengah"},
		{ID: "95", Name: "Papua Pegunungan"},
		{ID: "96", Name: "Papua Barat Daya"},
	}

	rawCities := []struct {
		ProvinceID   string
		ProvinceName string
		Cities       []string
	}{
		{
			ProvinceID: "11", ProvinceName: "Aceh",
			Cities: []string{
				"Kota Banda Aceh", "Kota Sabang", "Kota Lhokseumawe", "Kota Langsa", "Kota Subulussalam",
				"Kab. Aceh Besar", "Kab. Aceh Pidie", "Kab. Pidie Jaya", "Kab. Aceh Utara", "Kab. Aceh Timur",
				"Kab. Aceh Tamiang", "Kab. Aceh Selatan", "Kab. Aceh Singkil", "Kab. Aceh Tenggara", "Kab. Aceh Tengah",
				"Kab. Bener Meriah", "Kab. Gayo Lues", "Kab. Aceh Barat", "Kab. Aceh Barat Daya", "Kab. Nagan Raya",
				"Kab. Aceh Jaya", "Kab. Simeulue",
			},
		},
		{
			ProvinceID: "12", ProvinceName: "Sumatera Utara",
			Cities: []string{
				"Kota Medan", "Kota Pematangsiantar", "Kota Sibolga", "Kota Tanjungbalai", "Kota Binjai",
				"Kota Tebing Tinggi", "Kota Padangsidimpuan", "Kota Gunungsitoli", "Kab. Deli Serdang", "Kab. Langkat",
				"Kab. Karo", "Kab. Simalungun", "Kab. Asahan", "Kab. Dairi", "Kab. Tapanuli Utara",
				"Kab. Tapanuli Tengah", "Kab. Tapanuli Selatan", "Kab. Nias", "Kab. Toba", "Kab. Mandailing Natal",
				"Kab. Nias Selatan", "Kab. Pakpak Bharat", "Kab. Humbang Hasundutan", "Kab. Samosir", "Kab. Serdang Bedagai",
				"Kab. Batu Bara", "Kab. Padang Lawas Utara", "Kab. Padang Lawas", "Kab. Labuhanbatu", "Kab. Labuhanbatu Utara",
				"Kab. Labuhanbatu Selatan", "Kab. Nias Barat", "Kab. Nias Utara",
			},
		},
		{
			ProvinceID: "13", ProvinceName: "Sumatera Barat",
			Cities: []string{
				"Kota Padang", "Kota Bukittinggi", "Kota Payakumbuh", "Kota Solok", "Kota Sawahlunto",
				"Kota Padang Panjang", "Kota Pariaman", "Kab. Agam", "Kab. Tanah Datar", "Kab. Padang Pariaman",
				"Kab. Pesisir Selatan", "Kab. Solok", "Kab. Solok Selatan", "Kab. Pasaman", "Kab. Pasaman Barat",
				"Kab. Lima Puluh Kota", "Kab. Sijunjung", "Kab. Dharmasraya", "Kab. Kepulauan Mentawai",
			},
		},
		{
			ProvinceID: "14", ProvinceName: "Riau",
			Cities: []string{
				"Kota Pekanbaru", "Kota Dumai", "Kab. Kampar", "Kab. Siak", "Kab. Pelalawan",
				"Kab. Indragiri Hulu", "Kab. Indragiri Hilir", "Kab. Bengkalis", "Kab. Rokan Hulu", "Kab. Rokan Hilir",
				"Kab. Kuantan Singingi", "Kab. Kepulauan Meranti",
			},
		},
		{
			ProvinceID: "15", ProvinceName: "Jambi",
			Cities: []string{
				"Kota Jambi", "Kota Sungai Penuh", "Kab. Muaro Jambi", "Kab. Batanghari", "Kab. Tanjab Barat",
				"Kab. Tanjab Timur", "Kab. Bungo", "Kab. Tebo", "Kab. Sarolangun", "Kab. Merangin", "Kab. Kerinci",
			},
		},
		{
			ProvinceID: "16", ProvinceName: "Sumatera Selatan",
			Cities: []string{
				"Kota Palembang", "Kota Prabumulih", "Kota Pagar Alam", "Kota Lubuklinggau", "Kab. Ogan Komering Ilir",
				"Kab. Ogan Komering Ulu", "Kab. Muara Enim", "Kab. Lahat", "Kab. Musi Rawas", "Kab. Musi Banyuasin",
				"Kab. Banyuasin", "Kab. Ogan Ilir", "Kab. OKU Timur", "Kab. OKU Selatan", "Kab. Empat Lawang",
				"Kab. Penukal Abab Lematang Ilir", "Kab. Musi Rawas Utara",
			},
		},
		{
			ProvinceID: "17", ProvinceName: "Bengkulu",
			Cities: []string{
				"Kota Bengkulu", "Kab. Bengkulu Utara", "Kab. Bengkulu Selatan", "Kab. Rejang Lebong", "Kab. Mukomuko",
				"Kab. Seluma", "Kab. Kaur", "Kab. Kepahiang", "Kab. Lebong", "Kab. Bengkulu Tengah",
			},
		},
		{
			ProvinceID: "18", ProvinceName: "Lampung",
			Cities: []string{
				"Kota Bandar Lampung", "Kota Metro", "Kab. Lampung Selatan", "Kab. Lampung Tengah", "Kab. Lampung Utara",
				"Kab. Lampung Barat", "Kab. Lampung Timur", "Kab. Tanggamus", "Kab. Pesawaran", "Kab. Pringsewu",
				"Kab. Tulang Bawang", "Kab. Tulang Bawang Barat", "Kab. Mesuji", "Kab. Way Kanan", "Kab. Pesisir Barat",
			},
		},
		{
			ProvinceID: "19", ProvinceName: "Kepulauan Bangka Belitung",
			Cities: []string{
				"Kota Pangkalpinang", "Kab. Bangka", "Kab. Bangka Barat", "Kab. Bangka Tengah", "Kab. Bangka Selatan",
				"Kab. Belitung", "Kab. Belitung Timur",
			},
		},
		{
			ProvinceID: "21", ProvinceName: "Kepulauan Riau",
			Cities: []string{
				"Kota Batam", "Kota Tanjungpinang", "Kab. Bintan", "Kab. Karimun", "Kab. Natuna",
				"Kab. Kepulauan Anambas", "Kab. Lingga",
			},
		},
		{
			ProvinceID: "31", ProvinceName: "DKI Jakarta",
			Cities: []string{
				"Kota Jakarta Pusat", "Kota Jakarta Utara", "Kota Jakarta Barat", "Kota Jakarta Selatan", "Kota Jakarta Timur",
				"Kab. Kepulauan Seribu",
			},
		},
		{
			ProvinceID: "32", ProvinceName: "Jawa Barat",
			Cities: []string{
				"Kota Bandung", "Kota Bogor", "Kota Depok", "Kota Bekasi", "Kota Cimahi",
				"Kota Tasikmalaya", "Kota Banjar", "Kota Cirebon", "Kota Sukabumi", "Kab. Bandung",
				"Kab. Bandung Barat", "Kab. Bogor", "Kab. Bekasi", "Kab. Karawang", "Kab. Purwakarta",
				"Kab. Subang", "Kab. Sumedang", "Kab. Garut", "Kab. Tasikmalaya", "Kab. Ciamis",
				"Kab. Pangandaran", "Kab. Kuningan", "Kab. Cirebon", "Kab. Majalengka", "Kab. Indramayu",
				"Kab. Cianjur", "Kab. Sukabumi",
			},
		},
		{
			ProvinceID: "33", ProvinceName: "Jawa Tengah",
			Cities: []string{
				"Kota Semarang", "Kota Surakarta", "Kota Magelang", "Kota Salatiga", "Kota Pekalongan",
				"Kota Tegal", "Kab. Semarang", "Kab. Demak", "Kab. Kendal", "Kab. Grobogan",
				"Kab. Boyolali", "Kab. Sukoharjo", "Kab. Karanganyar", "Kab. Sragen", "Kab. Wonogiri",
				"Kab. Klaten", "Kab. Magelang", "Kab. Temanggung", "Kab. Wonosobo", "Kab. Purworejo",
				"Kab. Kebumen", "Kab. Banjarnegara", "Kab. Purbalingga", "Kab. Banyumas", "Kab. Cilacap",
				"Kab. Brebes", "Kab. Tegal", "Kab. Pemalang", "Kab. Pekalongan", "Kab. Batang",
				"Kab. Kudus", "Kab. Pati", "Kab. Jepara", "Kab. Rembang", "Kab. Blora",
			},
		},
		{
			ProvinceID: "34", ProvinceName: "DI Yogyakarta",
			Cities: []string{
				"Kota Yogyakarta", "Kab. Sleman", "Kab. Bantul", "Kab. Gunungkidul", "Kab. Kulon Progo",
			},
		},
		{
			ProvinceID: "35", ProvinceName: "Jawa Timur",
			Cities: []string{
				"Kota Surabaya", "Kota Malang", "Kota Batu", "Kota Pasuruan", "Kota Probolinggo",
				"Kota Kediri", "Kota Blitar", "Kota Madiun", "Kota Mojokerto", "Kab. Sidoarjo",
				"Kab. Gresik", "Kab. Malang", "Kab. Pasuruan", "Kab. Mojokerto", "Kab. Jember",
				"Kab. Banyuwangi", "Kab. Kediri", "Kab. Blitar", "Kab. Madiun", "Kab. Nganjuk",
				"Kab. Tulungagung", "Kab. Trenggalek", "Kab. Ponorogo", "Kab. Pacitan", "Kab. Magetan",
				"Kab. Ngawi", "Kab. Bojonegoro", "Kab. Tuban", "Kab. Lamongan", "Kab. Bangkalan",
				"Kab. Sampang", "Kab. Pamekasan", "Kab. Sumenep", "Kab. Lumajang", "Kab. Bondowoso",
				"Kab. Situbondo", "Kab. Probolinggo",
			},
		},
		{
			ProvinceID: "36", ProvinceName: "Banten",
			Cities: []string{
				"Kota Tangerang", "Kota Tangerang Selatan", "Kota Serang", "Kota Cilegon",
				"Kab. Tangerang", "Kab. Serang", "Kab. Pandeglang", "Kab. Lebak",
			},
		},
		{
			ProvinceID: "51", ProvinceName: "Bali",
			Cities: []string{
				"Kota Denpasar", "Kab. Badung", "Kab. Gianyar", "Kab. Tabanan", "Kab. Buleleng",
				"Kab. Karangasem", "Kab. Klungkung", "Kab. Bangli", "Kab. Jembrana",
			},
		},
		{
			ProvinceID: "52", ProvinceName: "Nusa Tenggara Barat",
			Cities: []string{
				"Kota Mataram", "Kota Bima", "Kab. Lombok Barat", "Kab. Lombok Tengah", "Kab. Lombok Timur",
				"Kab. Lombok Utara", "Kab. Sumbawa", "Kab. Sumbawa Barat", "Kab. Dompu", "Kab. Bima",
			},
		},
		{
			ProvinceID: "53", ProvinceName: "Nusa Tenggara Timur",
			Cities: []string{
				"Kota Kupang", "Kab. Kupang", "Kab. Timor Tengah Selatan", "Kab. Timor Tengah Utara", "Kab. Belu",
				"Kab. Malaka", "Kab. Rote Ndao", "Kab. Sabu Raijua", "Kab. Alor", "Kab. Flores Timur",
				"Kab. Sikka", "Kab. Ende", "Kab. Ngada", "Kab. Nagekeo", "Kab. Manggarai",
				"Kab. Manggarai Barat", "Kab. Manggarai Timur", "Kab. Sumba Barat", "Kab. Sumba Timur", "Kab. Sumba Tengah",
				"Kab. Sumba Barat Daya", "Kab. Lembata",
			},
		},
		{
			ProvinceID: "61", ProvinceName: "Kalimantan Barat",
			Cities: []string{
				"Kota Pontianak", "Kota Singkawang", "Kab. Kubu Raya", "Kab. Mempawah", "Kab. Sambas",
				"Kab. Bengkayang", "Kab. Landak", "Kab. Sanggau", "Kab. Sekadau", "Kab. Sintang",
				"Kab. Melawi", "Kab. Kapuas Hulu", "Kab. Kayong Utara", "Kab. Ketapang",
			},
		},
		{
			ProvinceID: "62", ProvinceName: "Kalimantan Tengah",
			Cities: []string{
				"Kota Palangka Raya", "Kab. Kapuas", "Kab. Barito Selatan", "Kab. Barito Utara", "Kab. Barito Timur",
				"Kab. Murung Raya", "Kab. Gunung Mas", "Kab. Pulang Pisau", "Kab. Katingan", "Kab. Kotawaringin Timur",
				"Kab. Kotawaringin Barat", "Kab. Seruyan", "Kab. Lamandau", "Kab. Sukamara",
			},
		},
		{
			ProvinceID: "63", ProvinceName: "Kalimantan Selatan",
			Cities: []string{
				"Kota Banjarmasin", "Kota Banjarbaru", "Kab. Banjar", "Kab. Tanah Laut", "Kab. Tanah Bumbu",
				"Kab. Kotabaru", "Kab. Barito Kuala", "Kab. Tapin", "Kab. Hulu Sungai Selatan", "Kab. Hulu Sungai Tengah",
				"Kab. Hulu Sungai Utara", "Kab. Balangan", "Kab. Tabalong",
			},
		},
		{
			ProvinceID: "64", ProvinceName: "Kalimantan Timur",
			Cities: []string{
				"Kota Samarinda", "Kota Balikpapan", "Kota Bontang", "Kab. Kutai Kartanegara", "Kab. Kutai Timur",
				"Kab. Kutai Barat", "Kab. Paser", "Kab. Penajam Paser Utara", "Kab. Mahakam Ulu", "Kab. Berau",
			},
		},
		{
			ProvinceID: "65", ProvinceName: "Kalimantan Utara",
			Cities: []string{
				"Kota Tarakan", "Kab. Bulungan", "Kab. Malinau", "Kab. Nunukan", "Kab. Tana Tidung",
			},
		},
		{
			ProvinceID: "71", ProvinceName: "Sulawesi Utara",
			Cities: []string{
				"Kota Manado", "Kota Bitung", "Kota Tomohon", "Kota Kotamobagu", "Kab. Minahasa",
				"Kab. Minahasa Utara", "Kab. Minahasa Selatan", "Kab. Minahasa Tenggara", "Kab. Bolaang Mongondow", "Kab. Bolaang Mongondow Utara",
				"Kab. Bolaang Mongondow Selatan", "Kab. Bolaang Mongondow Timur", "Kab. Kepulauan Sangihe", "Kab. Kepulauan Talaud", "Kab. Kepulauan Siau Tagulandang Biaro",
			},
		},
		{
			ProvinceID: "72", ProvinceName: "Sulawesi Tengah",
			Cities: []string{
				"Kota Palu", "Kab. Donggala", "Kab. Sigi", "Kab. Parigi Moutong", "Kab. Poso",
				"Kab. Tojo Una-Una", "Kab. Banggai", "Kab. Banggai Kepulauan", "Kab. Banggai Laut", "Kab. Morowali",
				"Kab. Morowali Utara", "Kab. Tolitoli", "Kab. Buol",
			},
		},
		{
			ProvinceID: "73", ProvinceName: "Sulawesi Selatan",
			Cities: []string{
				"Kota Makassar", "Kota Parepare", "Kota Palopo", "Kab. Gowa", "Kab. Maros",
				"Kab. Pangkajene dan Kepulauan", "Kab. Barru", "Kab. Bone", "Kab. Soppeng", "Kab. Wajo",
				"Kab. Sidenreng Rappang", "Kab. Pinrang", "Kab. Enrekang", "Kab. Luwu", "Kab. Luwu Utara",
				"Kab. Luwu Timur", "Kab. Tana Toraja", "Kab. Toraja Utara", "Kab. Sinjai", "Kab. Bulukumba",
				"Kab. Bantaeng", "Kab. Jeneponto", "Kab. Takalar", "Kab. Kepulauan Selayar",
			},
		},
		{
			ProvinceID: "74", ProvinceName: "Sulawesi Tenggara",
			Cities: []string{
				"Kota Kendari", "Kota Baubau", "Kab. Konawe", "Kab. Konawe Selatan", "Kab. Konawe Utara",
				"Kab. Konawe Kepulauan", "Kab. Kolaka", "Kab. Kolaka Utara", "Kab. Kolaka Timur", "Kab. Bombana",
				"Kab. Muna", "Kab. Muna Barat", "Kab. Buton", "Kab. Buton Utara", "Kab. Buton Selatan",
				"Kab. Buton Tengah", "Kab. Wakatobi",
			},
		},
		{
			ProvinceID: "75", ProvinceName: "Gorontalo",
			Cities: []string{
				"Kota Gorontalo", "Kab. Gorontalo", "Kab. Gorontalo Utara", "Kab. Boalemo", "Kab. Bone Bolango",
				"Kab. Pohuwato",
			},
		},
		{
			ProvinceID: "76", ProvinceName: "Sulawesi Barat",
			Cities: []string{
				"Kab. Mamuju", "Kab. Mamuju Tengah", "Kab. Pasangkayu", "Kab. Polewali Mandar", "Kab. Majene",
				"Kab. Mamasa",
			},
		},
		{
			ProvinceID: "81", ProvinceName: "Maluku",
			Cities: []string{
				"Kota Ambon", "Kota Tual", "Kab. Maluku Tengah", "Kab. Seram Bagian Barat", "Kab. Seram Bagian Timur",
				"Kab. Maluku Tenggara", "Kab. Kepulauan Tanimbar", "Kab. Maluku Barat Daya", "Kab. Buru", "Kab. Buru Selatan",
				"Kab. Kepulauan Aru",
			},
		},
		{
			ProvinceID: "82", ProvinceName: "Maluku Utara",
			Cities: []string{
				"Kota Ternate", "Kota Tidore Kepulauan", "Kab. Halmahera Barat", "Kab. Halmahera Utara", "Kab. Halmahera Selatan",
				"Kab. Halmahera Timur", "Kab. Halmahera Tengah", "Kab. Kepulauan Sula", "Kab. Pulau Taliabu", "Kab. Pulau Morotai",
			},
		},
		{
			ProvinceID: "91", ProvinceName: "Papua",
			Cities: []string{
				"Kota Jayapura", "Kab. Jayapura", "Kab. Keerom", "Kab. Sarmi", "Kab. Mamberamo Raya",
				"Kab. Biak Numfor", "Kab. Supiori", "Kab. Kepulauan Yapen", "Kab. Waropen",
			},
		},
		{
			ProvinceID: "92", ProvinceName: "Papua Barat",
			Cities: []string{
				"Kota Manokwari", "Kab. Manokwari", "Kab. Manokwari Selatan", "Kab. Pegunungan Arfak", "Kab. Teluk Bintuni",
				"Kab. Teluk Wondama", "Kab. Kaimana", "Kab. Fakfak",
			},
		},
		{
			ProvinceID: "93", ProvinceName: "Papua Selatan",
			Cities: []string{
				"Kab. Merauke", "Kab. Mappi", "Kab. Asmat", "Kab. Boven Digoel",
			},
		},
		{
			ProvinceID: "94", ProvinceName: "Papua Tengah",
			Cities: []string{
				"Kab. Nabire", "Kab. Mimika", "Kab. Puncak Jaya", "Kab. Puncak", "Kab. Dogiyai",
				"Kab. Intan Jaya", "Kab. Deiyai", "Kab. Paniai",
			},
		},
		{
			ProvinceID: "95", ProvinceName: "Papua Pegunungan",
			Cities: []string{
				"Kab. Jayawijaya", "Kab. Lanny Jaya", "Kab. Nduga", "Kab. Mamberamo Tengah", "Kab. Yalimo",
				"Kab. Yahukimo", "Kab. Tolikara", "Kab. Pegunungan Bintang",
			},
		},
		{
			ProvinceID: "96", ProvinceName: "Papua Barat Daya",
			Cities: []string{
				"Kota Sorong", "Kab. Sorong", "Kab. Sorong Selatan", "Kab. Raja Ampat", "Kab. Tambrauw",
				"Kab. Maybrat",
			},
		},
	}

	cityIDCount := 1
	for _, group := range rawCities {
		for _, cityName := range group.Cities {
			cityID := group.ProvinceID + strings.Repeat("0", 4-len(string(rune(cityIDCount)))) + string(rune(cityIDCount))
			_ = cityID
			r.cities = append(r.cities, models.LocationCity{
				ID:           group.ProvinceID + "_" + strings.ReplaceAll(strings.ToLower(cityName), " ", "_"),
				Name:         cityName,
				ProvinceID:   group.ProvinceID,
				ProvinceName: group.ProvinceName,
			})
			cityIDCount++
		}
	}
}
