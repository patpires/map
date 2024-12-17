// Registrar a projeção EPSG:31984
proj4.defs("EPSG:31984", "+proj=utm +zone=24 +south +datum=SIRGAS2000 +units=m +no_defs");
ol.proj.proj4.register(proj4);

// Criar o mapa
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([-38.5014, -12.9714]), // Coordenadas de Salvador
        zoom: 12
    })
});

// Fonte de dados GeoJSON para a camada vetorial
const vectorSource = new ol.source.Vector({
    url: 'bairros_sedur.geojson', // Substitua pelo caminho do seu arquivo GeoJSON
    format: new ol.format.GeoJSON({
        dataProjection: 'EPSG:31984',
        featureProjection: 'EPSG:3857'
    })
});

// Criação da camada vetorial
const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'blue',
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 0, 255, 0.1)'
        })
    })
});

// Adicionar a camada vetorial ao mapa
map.addLayer(vectorLayer);

// Carregar dados dos bairros do JSON
let dadosBairros;

fetch('dados_bairros.json') // Substitua pelo caminho real do seu arquivo JSON
    .then(response => response.json())
    .then(data => {
        dadosBairros = data;
        preencherDropdowns(data);
    })
    .catch(error => console.error('Erro ao carregar os dados:', error));

// Criar um overlay para a tooltip
const tooltip = document.getElementById('tooltip');

map.on('pointermove', function(evt) {
    const pixel = map.getEventPixel(evt.originalEvent);
    const hit = map.hasFeatureAtPixel(pixel);

    if (hit) {
        const feature = map.getFeaturesAtPixel(pixel)[0];
        const bairroName = feature.get('NOME_BAIRR');
        const dados = dadosBairros.find(d => d.NOME_BAIRR === bairroName);

        if (dados) {
            tooltip.innerHTML = `
                <strong>Bairro:</strong> ${dados.NOME_BAIRR}<br>
                <strong>Setor:</strong> ${dados.SETOR || 'Não Informado'}<br>
                <strong>Zona:</strong> ${dados.ZONA}<br>
                <strong>UR-1:</strong> ${dados['UR-1']}<br>
                <strong>Reservatório:</strong> ${dados.RESERVATORIO || 'Nenhuma'}<br>
                <strong>Localidade:</strong> ${dados.LOCALIDADE || 'Nenhuma'}<br>
                <strong>Referência:</strong> ${dados.REFERENCIA || 'Nenhuma'}<br>
                <strong>Demandas MP:</strong> ${dados.Obs || 'Nenhuma'}
            `;
            tooltip.style.left = `${evt.originalEvent.pageX + 10}px`;
            tooltip.style.top = `${evt.originalEvent.pageY + 10}px`;
            tooltip.classList.remove('hidden');
        }
    } else {
        tooltip.classList.add('hidden');
    }
});

// Função para preencher os dropdowns
function preencherDropdowns(data) {
    const setores = new Set();
    const zonas = new Set();
    const ur1Set = new Set();
    const bairros = new Set();
    const observacoes = new Set();

    data.forEach(bairro => {
        if (bairro.Obs && bairro.SETOR.trim() !== "") {
            setores.add(bairro.SETOR.toString());
        }
        zonas.add(bairro.ZONA.toString());
        ur1Set.add(bairro['UR-1']);
        bairros.add(bairro.NOME_BAIRR);

        // Verifica se a observação está presente e não é nula
        if (bairro.Obs && bairro.Obs.trim() !== "") {
            observacoes.add(bairro.Obs);
        } 
    });

    const setorSelect = document.getElementById('setor');
    const zonaSelect = document.getElementById('zona');
    const ur1Select = document.getElementById('ur1');
    const bairroSelect = document.getElementById('nome_bairro');
    const obsSelect = document.getElementById('obs');

    setores.forEach(setor => {
        const option = document.createElement('option');
        option.value = setor;
        option.text = setor;
        setorSelect.add(option);
    });

    zonas.forEach(zona => {
        const option = document.createElement('option');
        option.value = zona;
        option.text = zona;
        zonaSelect.add(option);
    });

    ur1Set.forEach(ur1 => {
        const option = document.createElement('option');
        option.value = ur1;
        option.text = ur1;
        ur1Select.add(option);
    });

    bairros.forEach(bairro => {
        const option = document.createElement('option');
        option.value = bairro;
        option.text = bairro;
        bairroSelect.add(option);
    });

    observacoes.forEach(obs => {
        const option = document.createElement('option');
        option.value = obs;
        option.text = obs;
        obsSelect.add(option);
    });
}

// Função para estilizar os bairros filtrados e processo de busca
function filterBairros(setor, zona, ur1, nomeBairro, obsList) {
    const filteredBairros = dadosBairros.filter(bairro => {
        const setorMatch = (setor === "" || bairro.SETOR.toString() === setor);
        const zonaMatch = (zona === "" || bairro.ZONA.toString() === zona);
        const ur1Match = (ur1 === "" || bairro['UR-1'] === ur1);
        const nomeBairroMatch = (nomeBairro === "" || bairro.NOME_BAIRR === nomeBairro);
        
        // Verificar se pelo menos uma observação selecionada está presente no bairro
        const obsMatch = (obsList.length === 0 || obsList.some(obs => bairro.Obs.includes(obs)));

        return setorMatch && zonaMatch && ur1Match && nomeBairroMatch && obsMatch;
    });

    vectorLayer.setStyle(function(feature) {
        const bairroName = feature.get('NOME_BAIRR');
        const match = filteredBairros.find(d => d.NOME_BAIRR === bairroName);
        if (match) {
            return new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 0, 0, 0.1)'
                })
            });
        } else {
            return new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'blue',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 255, 0.1)'
                })
            });
        }
    });
}

document.getElementById('limpar').addEventListener('click', function() {
    location.reload(); // Recarrega a página para limpar todos os filtros
});

// Função getSelectedOptions para capturar múltiplas seleções corretamente
function getSelectedOptions(select) {
    const result = [];
    const options = select && select.options;
    for (let i = 0, len = options.length; i < len; i++) {
        const opt = options[i];
        if (opt.selected) {
            result.push(opt.value || opt.text);
        }
    }
    return result;
}

document.getElementById('buscar').addEventListener('click', function() {
    const setor = document.getElementById('setor').value;
    const zona = document.getElementById('zona').value;
    const ur1 = document.getElementById('ur1').value;
    const nomeBairro = document.getElementById('nome_bairro').value;
    const obsList = getSelectedOptions(document.getElementById('obs'));
    filterBairros(setor, zona, ur1, nomeBairro, obsList);
});
