const subfolders = [
  { name: 'Dubai 2025', id: '1uIU9-3QEzlUIZPwYGTvWXrf0133WH2za' },
  { name: 'Ajmer Agra 25', id: '17rjsvO8qP2dAime91juLLN1q68ADloZS' },
  { name: 'Meccah & Madina', id: '15lQOoy7sjDZvTGB1MP9SI1v-2hMLo-Gs' },
  { name: 'GoPro-Exports', id: '1IBD6D1qvMTG90WueDHNhiJc6K63hRdDp' },
  { name: 'Pachmari', id: '1OcPf822VdQ2VqqdfPuIap_2V_jJnByzC' }
];

async function run() {
  for (const s of subfolders) {
    const res = await fetch('http://localhost:3000/api/drive/folder?folder=' + s.id);
    const data = await res.json();
    console.log(s.name + ': total=' + data.itemCount + ', images=' + data.imageCount + ', videos=' + data.videoCount);
  }
}
run();
