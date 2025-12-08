// Script to seed default chatrooms for ALL regions
// Run with: npx ts-node --project tsconfig.seed.json scripts/seed-chatrooms.ts

import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, setDoc, getDocs, collection } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBts3VdOg4ktMutTVh5ebugbD0pgf-F4KY",
    authDomain: "varbe-e96d2.firebaseapp.com",
    databaseURL: "https://varbe-e96d2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "varbe-e96d2",
    storageBucket: "varbe-e96d2.firebasestorage.app",
    messagingSenderId: "851653426804",
    appId: "1:851653426804:web:87c6e4e9f3c61cb0d0db21",
    measurementId: "G-LKJ6C1BPTC"
};

const app = initializeApp(firebaseConfig);
// Use the "varbe" database, not the default one
const db = initializeFirestore(app, {}, "varbe");

interface Chatroom {
    name: string;
    description: string;
    category: string;
    region: string;
    emoji: string;
    color: string;
    isActive: boolean;
    isPinned?: boolean;
    membersCount: number;
    onlineCount: number;
    messagesCount: number;
    createdAt: number;
}

// ========================================
// ROOM TEMPLATES - BASE CATEGORIES
// ========================================

interface RoomTemplate {
    category: string;
    emoji: string;
    color: string;
    isPinned?: boolean;
    translations: Record<string, { name: string; description: string }>;
}

const roomTemplates: RoomTemplate[] = [
    // General Chat - Always pinned
    {
        category: 'general',
        emoji: '💬',
        color: '#CCFF00',
        isPinned: true,
        translations: {
            de: { name: 'Allgemeiner Chat DE', description: 'Der Hauptchat für deutschsprachige Künstler. Willkommen! Hier wird über alles gequatscht.' },
            at: { name: 'Allgemeiner Chat AT', description: 'Der Hauptchat für Künstler aus Österreich. Servus und willkommen!' },
            ch: { name: 'Allgemeiner Chat CH', description: 'Der Hauptchat für Künstler aus der Schweiz. Grüezi mitenand!' },
            global: { name: 'Global Art Hub', description: 'The international hub for artists worldwide. English speaking. Everyone welcome!' },
            us: { name: 'US Creatives Hub', description: 'The main chat for American artists. From coast to coast, share and connect!' },
            uk: { name: 'UK Artists Lounge', description: 'The main chat for artists in the United Kingdom. Chat, share, connect!' },
            fr: { name: 'Café des Artistes', description: 'Le chat principal pour les artistes francophones. Bienvenue à tous!' },
            es: { name: 'Arte España', description: 'El chat principal para artistas hispanohablantes. ¡Bienvenidos!' },
            it: { name: 'Arte Italiana', description: 'Il chat principale per artisti italiani. Benvenuti nella community!' },
            nl: { name: 'Nederlandse Kunstenaars', description: 'De hoofdchat voor Nederlandse en Vlaamse kunstenaars. Welkom!' },
            pl: { name: 'Polscy Artyści', description: 'Główny czat dla polskich artystów. Witamy serdecznie!' },
        }
    },
    // Digital Art
    {
        category: 'digital_art',
        emoji: '🖥️',
        color: '#FF10F0',
        isPinned: true,
        translations: {
            de: { name: 'Digital Art Lounge DE', description: 'Alles rund um digitale Kunst - Procreate, Photoshop, Clip Studio, Tablets und mehr.' },
            at: { name: 'Digital Art Lounge AT', description: 'Digitale Kunst für österreichische Künstler - Software, Tablets, Tipps & Tricks.' },
            ch: { name: 'Digital Art Lounge CH', description: 'Digitale Kunst für Schweizer Künstler - Software, Tablets, Tipps & Tricks.' },
            global: { name: 'Digital Art Worldwide', description: 'Digital artists from around the globe. Share your work, tips and techniques.' },
            us: { name: 'Digital Art USA', description: 'Digital art for American artists - Procreate, Photoshop, tablets and more.' },
            uk: { name: 'Digital Art UK', description: 'Digital art for UK artists - Software, tablets, tips and techniques.' },
            fr: { name: 'Art Numérique FR', description: 'Tout sur l\'art numérique - Procreate, Photoshop, tablettes et plus.' },
            es: { name: 'Arte Digital ES', description: 'Todo sobre arte digital - Procreate, Photoshop, tabletas y más.' },
            it: { name: 'Arte Digitale IT', description: 'Tutto sull\'arte digitale - Procreate, Photoshop, tablet e altro.' },
            nl: { name: 'Digitale Kunst NL', description: 'Alles over digitale kunst - Procreate, Photoshop, tablets en meer.' },
            pl: { name: 'Sztuka Cyfrowa PL', description: 'Wszystko o sztuce cyfrowej - Procreate, Photoshop, tablety i więcej.' },
        }
    },
    // Traditional Art
    {
        category: 'traditional',
        emoji: '🎨',
        color: '#FF6B35',
        translations: {
            de: { name: 'Traditional Art Studio DE', description: 'Acryl, Öl, Aquarell, Gouache, Buntstifte - alles was analog ist!' },
            at: { name: 'Traditional Art Studio AT', description: 'Acryl, Öl, Aquarell, Gouache - traditionelle Kunst aus Österreich!' },
            ch: { name: 'Traditional Art Studio CH', description: 'Acryl, Öl, Aquarell, Gouache - traditionelle Kunst aus der Schweiz!' },
            global: { name: 'Traditional Art Worldwide', description: 'Acrylic, oil, watercolor, gouache - everything analog from around the world!' },
            us: { name: 'Traditional Art USA', description: 'Acrylic, oil, watercolor, pencils - traditional art for American artists!' },
            uk: { name: 'Traditional Art UK', description: 'Acrylic, oil, watercolor, pencils - traditional art for UK artists!' },
            fr: { name: 'Art Traditionnel FR', description: 'Acrylique, huile, aquarelle, gouache - tout ce qui est analogique!' },
            es: { name: 'Arte Tradicional ES', description: 'Acrílico, óleo, acuarela, gouache - todo lo analógico!' },
            it: { name: 'Arte Tradizionale IT', description: 'Acrilico, olio, acquerello, tempera - tutto quello che è analogico!' },
            nl: { name: 'Traditionele Kunst NL', description: 'Acryl, olie, aquarel, gouache - alles wat analoog is!' },
            pl: { name: 'Sztuka Tradycyjna PL', description: 'Akryl, olej, akwarela, gwasz - wszystko co analogowe!' },
        }
    },
    // Illustration & Comics
    {
        category: 'illustration',
        emoji: '✏️',
        color: '#9B59B6',
        translations: {
            de: { name: 'Illustration & Comics DE', description: 'Für Illustratoren, Comic-Zeichner und Character Designer.' },
            at: { name: 'Illustration & Comics AT', description: 'Für Illustratoren und Comic-Zeichner aus Österreich.' },
            ch: { name: 'Illustration & Comics CH', description: 'Für Illustratoren und Comic-Zeichner aus der Schweiz.' },
            global: { name: 'Illustration Station', description: 'Illustrators unite! Book illustration, editorial, character design.' },
            us: { name: 'Illustration & Comics USA', description: 'For American illustrators, comic artists and character designers.' },
            uk: { name: 'Illustration & Comics UK', description: 'For UK illustrators, comic artists and character designers.' },
            fr: { name: 'Illustration & BD FR', description: 'Pour les illustrateurs, dessinateurs de BD et character designers.' },
            es: { name: 'Ilustración & Comics ES', description: 'Para ilustradores, dibujantes de cómics y diseñadores de personajes.' },
            it: { name: 'Illustrazione & Fumetti IT', description: 'Per illustratori, fumettisti e character designer.' },
            nl: { name: 'Illustratie & Comics NL', description: 'Voor illustratoren, striptekenaar en character designers.' },
            pl: { name: 'Ilustracja & Komiksy PL', description: 'Dla ilustratorów, rysowników komiksów i character designerów.' },
        }
    },
    // Streetart & Graffiti
    {
        category: 'subculture',
        emoji: '🔥',
        color: '#E74C3C',
        isPinned: true,
        translations: {
            de: { name: 'Streetart & Graffiti DE', description: 'Urban Art, Graffiti, Stencils, Paste-Ups und Streetart-Kultur.' },
            at: { name: 'Streetart & Graffiti AT', description: 'Urban Art und Graffiti-Szene in Österreich.' },
            ch: { name: 'Streetart & Graffiti CH', description: 'Urban Art und Graffiti-Szene in der Schweiz.' },
            global: { name: 'Street Art Global', description: 'Urban art, murals, graffiti from cities around the world.' },
            us: { name: 'Street Art USA', description: 'Urban art, murals, graffiti from American cities.' },
            uk: { name: 'Street Art UK', description: 'Urban art, murals, graffiti from UK cities.' },
            fr: { name: 'Street Art FR', description: 'Art urbain, graffiti, pochoirs et culture street art.' },
            es: { name: 'Street Art ES', description: 'Arte urbano, grafiti, plantillas y cultura callejera.' },
            it: { name: 'Street Art IT', description: 'Arte urbana, graffiti, stencil e cultura street art.' },
            nl: { name: 'Street Art NL', description: 'Urban art, graffiti, stencils en street art cultuur.' },
            pl: { name: 'Street Art PL', description: 'Sztuka uliczna, graffiti, szablony i kultura street art.' },
        }
    },
    // Gothic & Dark Art
    {
        category: 'subculture',
        emoji: '🦇',
        color: '#2C3E50',
        translations: {
            de: { name: 'Gothic & Dark Art DE', description: 'Dunkle Ästhetik, Gothic, Horror Art, Occult und Dark Fantasy.' },
            at: { name: 'Gothic & Dark Art AT', description: 'Dunkle Ästhetik und Gothic-Kunst aus Österreich.' },
            ch: { name: 'Gothic & Dark Art CH', description: 'Dunkle Ästhetik und Gothic-Kunst aus der Schweiz.' },
            global: { name: 'Gothic & Dark Art', description: 'Dark aesthetics, gothic, horror art, occult and dark fantasy.' },
            us: { name: 'Gothic & Dark Art USA', description: 'Dark aesthetics, gothic, horror art from the US.' },
            uk: { name: 'Gothic & Dark Art UK', description: 'Dark aesthetics, gothic, horror art from the UK.' },
            fr: { name: 'Art Gothique & Sombre FR', description: 'Esthétique sombre, gothique, art horrifique et dark fantasy.' },
            es: { name: 'Arte Gótico & Oscuro ES', description: 'Estética oscura, gótico, arte de terror y fantasía oscura.' },
            it: { name: 'Arte Gotica & Oscura IT', description: 'Estetica dark, gotico, horror art e dark fantasy.' },
            nl: { name: 'Gothic & Dark Art NL', description: 'Donkere esthetiek, gothic, horror art en dark fantasy.' },
            pl: { name: 'Sztuka Gotycka & Mroczna PL', description: 'Mroczna estetyka, gotyk, horror art i dark fantasy.' },
        }
    },
    // Anime & Manga
    {
        category: 'illustration',
        emoji: '🌸',
        color: '#FF69B4',
        translations: {
            de: { name: 'Anime & Manga Style DE', description: 'Für alle die im japanischen Stil zeichnen - Anime, Manga, Light Novels.' },
            at: { name: 'Anime & Manga Style AT', description: 'Anime und Manga-Kunst aus Österreich.' },
            ch: { name: 'Anime & Manga Style CH', description: 'Anime und Manga-Kunst aus der Schweiz.' },
            global: { name: 'Anime & Manga Worldwide', description: 'For everyone who draws in Japanese style - anime, manga, light novels.' },
            us: { name: 'Anime & Manga USA', description: 'Anime and manga style art from American artists.' },
            uk: { name: 'Anime & Manga UK', description: 'Anime and manga style art from UK artists.' },
            fr: { name: 'Anime & Manga FR', description: 'Pour tous ceux qui dessinent en style japonais - anime, manga.' },
            es: { name: 'Anime & Manga ES', description: 'Para todos los que dibujan estilo japonés - anime, manga.' },
            it: { name: 'Anime & Manga IT', description: 'Per tutti quelli che disegnano in stile giapponese - anime, manga.' },
            nl: { name: 'Anime & Manga NL', description: 'Voor iedereen die in Japanse stijl tekent - anime, manga.' },
            pl: { name: 'Anime & Manga PL', description: 'Dla wszystkich rysujących w stylu japońskim - anime, manga.' },
        }
    },
    // Tattoo Artists
    {
        category: 'subculture',
        emoji: '🖤',
        color: '#1ABC9C',
        translations: {
            de: { name: 'Tattoo Artists DE', description: 'Tattoo-Designs, Flash, Styles und Branchentalk.' },
            at: { name: 'Tattoo Artists AT', description: 'Tattoo-Szene und Designs aus Österreich.' },
            ch: { name: 'Tattoo Artists CH', description: 'Tattoo-Szene und Designs aus der Schweiz.' },
            global: { name: 'Tattoo Artists Worldwide', description: 'Tattoo designs, flash, styles and industry talk worldwide.' },
            us: { name: 'Tattoo Artists USA', description: 'Tattoo designs, flash, styles from American artists.' },
            uk: { name: 'Tattoo Artists UK', description: 'Tattoo designs, flash, styles from UK artists.' },
            fr: { name: 'Tatoueurs FR', description: 'Designs de tatouage, flash, styles et discussions professionnelles.' },
            es: { name: 'Tatuadores ES', description: 'Diseños de tatuajes, flash, estilos y charla del sector.' },
            it: { name: 'Tatuatori IT', description: 'Design di tatuaggi, flash, stili e talk del settore.' },
            nl: { name: 'Tattoo Artiesten NL', description: 'Tattoo designs, flash, stijlen en branchetalk.' },
            pl: { name: 'Tatuażyści PL', description: 'Projekty tatuaży, flash, style i rozmowy branżowe.' },
        }
    },
    // Concept Art & Game Art
    {
        category: 'concept_art',
        emoji: '🎮',
        color: '#3498DB',
        translations: {
            de: { name: 'Concept Art & Game Art DE', description: 'Game Design, Concept Art, Environment Design, Character Design für Games.' },
            at: { name: 'Concept Art & Game Art AT', description: 'Game Art und Concept Design aus Österreich.' },
            ch: { name: 'Concept Art & Game Art CH', description: 'Game Art und Concept Design aus der Schweiz.' },
            global: { name: 'Concept Art & Game Art', description: 'Game design, concept art, environment and character design for games.' },
            us: { name: 'Concept Art & Game Art USA', description: 'Game design and concept art from American artists.' },
            uk: { name: 'Concept Art & Game Art UK', description: 'Game design and concept art from UK artists.' },
            fr: { name: 'Concept Art & Game Art FR', description: 'Game design, concept art, environment et character design.' },
            es: { name: 'Concept Art & Game Art ES', description: 'Game design, concept art, diseño de entornos y personajes.' },
            it: { name: 'Concept Art & Game Art IT', description: 'Game design, concept art, environment e character design.' },
            nl: { name: 'Concept Art & Game Art NL', description: 'Game design, concept art, environment en character design.' },
            pl: { name: 'Concept Art & Game Art PL', description: 'Game design, concept art, environment i character design.' },
        }
    },
    // Animation & Motion
    {
        category: 'animation',
        emoji: '🎬',
        color: '#F39C12',
        translations: {
            de: { name: 'Animation & Motion DE', description: '2D Animation, 3D Animation, Motion Graphics, After Effects.' },
            at: { name: 'Animation & Motion AT', description: 'Animation und Motion Design aus Österreich.' },
            ch: { name: 'Animation & Motion CH', description: 'Animation und Motion Design aus der Schweiz.' },
            global: { name: 'Animation & Motion', description: '2D animation, 3D animation, motion graphics worldwide.' },
            us: { name: 'Animation & Motion USA', description: '2D animation, 3D animation, motion graphics from the US.' },
            uk: { name: 'Animation & Motion UK', description: '2D animation, 3D animation, motion graphics from the UK.' },
            fr: { name: 'Animation & Motion FR', description: 'Animation 2D, animation 3D, motion graphics, After Effects.' },
            es: { name: 'Animación & Motion ES', description: 'Animación 2D, animación 3D, motion graphics.' },
            it: { name: 'Animazione & Motion IT', description: 'Animazione 2D, animazione 3D, motion graphics.' },
            nl: { name: 'Animatie & Motion NL', description: '2D animatie, 3D animatie, motion graphics.' },
            pl: { name: 'Animacja & Motion PL', description: 'Animacja 2D, animacja 3D, motion graphics.' },
        }
    },
    // Photography
    {
        category: 'photography',
        emoji: '📷',
        color: '#34495E',
        translations: {
            de: { name: 'Fotografie Treff DE', description: 'Analog, Digital, Portrait, Landscape, Street Photography.' },
            at: { name: 'Fotografie Treff AT', description: 'Fotografie-Community aus Österreich.' },
            ch: { name: 'Fotografie Treff CH', description: 'Fotografie-Community aus der Schweiz.' },
            global: { name: 'Photography Worldwide', description: 'Analog, digital, portrait, landscape, street photography.' },
            us: { name: 'Photography USA', description: 'Photography community for American photographers.' },
            uk: { name: 'Photography UK', description: 'Photography community for UK photographers.' },
            fr: { name: 'Photographie FR', description: 'Analogique, numérique, portrait, paysage, photographie de rue.' },
            es: { name: 'Fotografía ES', description: 'Analógica, digital, retrato, paisaje, fotografía callejera.' },
            it: { name: 'Fotografia IT', description: 'Analogica, digitale, ritratto, paesaggio, street photography.' },
            nl: { name: 'Fotografie NL', description: 'Analoog, digitaal, portret, landschap, straatfotografie.' },
            pl: { name: 'Fotografia PL', description: 'Analogowa, cyfrowa, portret, krajobraz, street photography.' },
        }
    },
    // Freelance & Business
    {
        category: 'business',
        emoji: '💼',
        color: '#27AE60',
        translations: {
            de: { name: 'Freelance & Business DE', description: 'Tipps für Selbstständige - Preise, Verträge, Steuern, Kundenakquise.' },
            at: { name: 'Freelance & Business AT', description: 'Tipps für Selbstständige in Österreich - Preise, Verträge, Steuern.' },
            ch: { name: 'Freelance & Business CH', description: 'Tipps für Selbstständige in der Schweiz - Preise, Verträge, Steuern.' },
            global: { name: 'Freelance & Business', description: 'Tips for freelancers - pricing, contracts, taxes, client acquisition.' },
            us: { name: 'Freelance & Business USA', description: 'Tips for American freelancers - pricing, contracts, taxes.' },
            uk: { name: 'Freelance & Business UK', description: 'Tips for UK freelancers - pricing, contracts, taxes.' },
            fr: { name: 'Freelance & Business FR', description: 'Conseils pour indépendants - tarifs, contrats, impôts.' },
            es: { name: 'Freelance & Business ES', description: 'Consejos para autónomos - precios, contratos, impuestos.' },
            it: { name: 'Freelance & Business IT', description: 'Consigli per freelancer - prezzi, contratti, tasse.' },
            nl: { name: 'Freelance & Business NL', description: 'Tips voor freelancers - prijzen, contracten, belasting.' },
            pl: { name: 'Freelance & Business PL', description: 'Porady dla freelancerów - ceny, umowy, podatki.' },
        }
    },
    // Feedback & Critique
    {
        category: 'critique',
        emoji: '🔍',
        color: '#FFD700',
        translations: {
            de: { name: 'Feedback & Kritik DE', description: 'Teile deine Arbeiten und erhalte konstruktives Feedback von der Community.' },
            at: { name: 'Feedback & Kritik AT', description: 'Konstruktives Feedback für Künstler aus Österreich.' },
            ch: { name: 'Feedback & Kritik CH', description: 'Konstruktives Feedback für Künstler aus der Schweiz.' },
            global: { name: 'Feedback & Critique', description: 'Share your work and receive constructive feedback from the community.' },
            us: { name: 'Feedback & Critique USA', description: 'Constructive feedback for American artists.' },
            uk: { name: 'Feedback & Critique UK', description: 'Constructive feedback for UK artists.' },
            fr: { name: 'Feedback & Critique FR', description: 'Partagez vos œuvres et recevez des critiques constructives.' },
            es: { name: 'Feedback & Crítica ES', description: 'Comparte tus trabajos y recibe críticas constructivas.' },
            it: { name: 'Feedback & Critica IT', description: 'Condividi i tuoi lavori e ricevi feedback costruttivo.' },
            nl: { name: 'Feedback & Kritiek NL', description: 'Deel je werk en ontvang constructieve feedback.' },
            pl: { name: 'Feedback & Krytyka PL', description: 'Podziel się swoimi pracami i otrzymaj konstruktywny feedback.' },
        }
    },
    // Collab
    {
        category: 'collab',
        emoji: '🤝',
        color: '#2ECC71',
        translations: {
            de: { name: 'Collab gesucht! DE', description: 'Suche Kollaborationen, Zine-Partner, Projekt-Mitstreiter.' },
            at: { name: 'Collab gesucht! AT', description: 'Kollaborationen und Projekte in Österreich.' },
            ch: { name: 'Collab gesucht! CH', description: 'Kollaborationen und Projekte in der Schweiz.' },
            global: { name: 'Collab Corner', description: 'Find collaboration partners for your projects. Art trades, zines, group shows.' },
            us: { name: 'Collab Corner USA', description: 'Find American collaboration partners for your projects.' },
            uk: { name: 'Collab Corner UK', description: 'Find UK collaboration partners for your projects.' },
            fr: { name: 'Collab Corner FR', description: 'Trouvez des partenaires pour vos projets - zines, expos collectives.' },
            es: { name: 'Collab Corner ES', description: 'Encuentra colaboradores para tus proyectos - zines, exposiciones.' },
            it: { name: 'Collab Corner IT', description: 'Trova partner per i tuoi progetti - zine, mostre collettive.' },
            nl: { name: 'Collab Corner NL', description: 'Vind samenwerkingspartners voor je projecten - zines, groepsexpo\'s.' },
            pl: { name: 'Collab Corner PL', description: 'Znajdź partnerów do współpracy - ziny, wystawy grupowe.' },
        }
    },
    // Punk & DIY
    {
        category: 'subculture',
        emoji: '🎸',
        color: '#E91E63',
        translations: {
            de: { name: 'Punk & DIY Szene DE', description: 'DIY-Kultur, Zines, Punk Art, Anti-Establishment Kunst.' },
            at: { name: 'Punk & DIY Szene AT', description: 'DIY-Kultur und Punk-Kunst aus Österreich.' },
            ch: { name: 'Punk & DIY Szene CH', description: 'DIY-Kultur und Punk-Kunst aus der Schweiz.' },
            global: { name: 'Punk & DIY Scene', description: 'DIY culture, zines, punk art, anti-establishment art.' },
            us: { name: 'Punk & DIY Scene USA', description: 'DIY culture and punk art from the American scene.' },
            uk: { name: 'Punk & DIY Scene UK', description: 'DIY culture and punk art from the UK scene.' },
            fr: { name: 'Punk & DIY FR', description: 'Culture DIY, zines, art punk, art anti-establishment.' },
            es: { name: 'Punk & DIY ES', description: 'Cultura DIY, zines, arte punk, arte anti-establishment.' },
            it: { name: 'Punk & DIY IT', description: 'Cultura DIY, zine, punk art, arte anti-establishment.' },
            nl: { name: 'Punk & DIY NL', description: 'DIY cultuur, zines, punk art, anti-establishment kunst.' },
            pl: { name: 'Punk & DIY PL', description: 'Kultura DIY, ziny, punk art, sztuka antyestablishmentowa.' },
        }
    },
    // Surrealismus & Psychedelic
    {
        category: 'subculture',
        emoji: '🍄',
        color: '#9C27B0',
        translations: {
            de: { name: 'Surrealismus & Psychedelic DE', description: 'Traumwelten, Surrealismus, Psychedelic Art, Visionäre Kunst.' },
            at: { name: 'Surrealismus & Psychedelic AT', description: 'Surreale und psychedelische Kunst aus Österreich.' },
            ch: { name: 'Surrealismus & Psychedelic CH', description: 'Surreale und psychedelische Kunst aus der Schweiz.' },
            global: { name: 'Surrealism & Psychedelic', description: 'Dream worlds, surrealism, psychedelic art, visionary art.' },
            us: { name: 'Surrealism & Psychedelic USA', description: 'Surreal and psychedelic art from American artists.' },
            uk: { name: 'Surrealism & Psychedelic UK', description: 'Surreal and psychedelic art from UK artists.' },
            fr: { name: 'Surréalisme & Psychédélique FR', description: 'Mondes oniriques, surréalisme, art psychédélique, art visionnaire.' },
            es: { name: 'Surrealismo & Psicodélico ES', description: 'Mundos oníricos, surrealismo, arte psicodélico, arte visionario.' },
            it: { name: 'Surrealismo & Psichedelico IT', description: 'Mondi onirici, surrealismo, arte psichedelica, arte visionaria.' },
            nl: { name: 'Surrealisme & Psychedelisch NL', description: 'Droomwerelden, surrealisme, psychedelische kunst, visionair.' },
            pl: { name: 'Surrealizm & Psychodelia PL', description: 'Światy snów, surrealizm, sztuka psychodeliczna, wizjonerska.' },
        }
    },
    // Comics & Bande Dessinée (specifically for FR)
    {
        category: 'illustration',
        emoji: '📚',
        color: '#F39C12',
        translations: {
            de: { name: 'Comics & Graphic Novels DE', description: 'Comics, Graphic Novels und Webcomics.' },
            at: { name: 'Comics & Graphic Novels AT', description: 'Comics und Graphic Novels aus Österreich.' },
            ch: { name: 'Comics & Graphic Novels CH', description: 'Comics und Graphic Novels aus der Schweiz.' },
            global: { name: 'Comics & Graphic Novels', description: 'Comics, graphic novels and webcomics from around the world.' },
            us: { name: 'Comics & Graphic Novels USA', description: 'American comics, graphic novels and webcomics.' },
            uk: { name: 'Comics & Graphic Novels UK', description: 'UK comics, graphic novels and webcomics.' },
            fr: { name: 'Bande Dessinée FR', description: 'Pour les amateurs de BD, comics et illustration narrative.' },
            es: { name: 'Cómics & Novelas Gráficas ES', description: 'Cómics, novelas gráficas y webcomics.' },
            it: { name: 'Fumetti & Graphic Novel IT', description: 'Fumetti, graphic novel e webcomics.' },
            nl: { name: 'Comics & Graphic Novels NL', description: 'Comics, graphic novels en webcomics.' },
            pl: { name: 'Komiksy & Graphic Novels PL', description: 'Komiksy, graphic novels i webcomiksy.' },
        }
    },
    // Vaporwave & Lo-Fi Aesthetics
    {
        category: 'subculture',
        emoji: '☁️',
        color: '#FF71CE',
        translations: {
            de: { name: 'Vaporwave & Lo-Fi DE', description: 'Retrowave, Vaporwave Ästhetik, Lo-Fi Art, 80er/90er Nostalgie.' },
            at: { name: 'Vaporwave & Lo-Fi AT', description: 'Vaporwave Ästhetik und Lo-Fi Art aus Österreich.' },
            ch: { name: 'Vaporwave & Lo-Fi CH', description: 'Vaporwave Ästhetik und Lo-Fi Art aus der Schweiz.' },
            global: { name: 'Vaporwave & Lo-Fi', description: 'Retrowave, vaporwave aesthetics, lo-fi art, 80s/90s nostalgia.' },
            us: { name: 'Vaporwave & Lo-Fi USA', description: 'Retrowave, vaporwave aesthetics and lo-fi art from the US.' },
            uk: { name: 'Vaporwave & Lo-Fi UK', description: 'Retrowave, vaporwave aesthetics and lo-fi art from the UK.' },
            fr: { name: 'Vaporwave & Lo-Fi FR', description: 'Retrowave, esthétique vaporwave, art lo-fi, nostalgie 80s/90s.' },
            es: { name: 'Vaporwave & Lo-Fi ES', description: 'Retrowave, estética vaporwave, arte lo-fi, nostalgia 80s/90s.' },
            it: { name: 'Vaporwave & Lo-Fi IT', description: 'Retrowave, estetica vaporwave, arte lo-fi, nostalgia 80s/90s.' },
            nl: { name: 'Vaporwave & Lo-Fi NL', description: 'Retrowave, vaporwave esthetiek, lo-fi art, 80s/90s nostalgie.' },
            pl: { name: 'Vaporwave & Lo-Fi PL', description: 'Retrowave, estetyka vaporwave, sztuka lo-fi, nostalgia lat 80/90.' },
        }
    },
    // Cyberpunk & Sci-Fi Art
    {
        category: 'subculture',
        emoji: '🤖',
        color: '#00F5FF',
        translations: {
            de: { name: 'Cyberpunk & Sci-Fi DE', description: 'Neon Cities, Cyberpunk, Science Fiction, Futuristische Kunst.' },
            at: { name: 'Cyberpunk & Sci-Fi AT', description: 'Cyberpunk und Science Fiction Kunst aus Österreich.' },
            ch: { name: 'Cyberpunk & Sci-Fi CH', description: 'Cyberpunk und Science Fiction Kunst aus der Schweiz.' },
            global: { name: 'Cyberpunk & Sci-Fi', description: 'Neon cities, cyberpunk, science fiction, futuristic art.' },
            us: { name: 'Cyberpunk & Sci-Fi USA', description: 'Cyberpunk and science fiction art from American artists.' },
            uk: { name: 'Cyberpunk & Sci-Fi UK', description: 'Cyberpunk and science fiction art from UK artists.' },
            fr: { name: 'Cyberpunk & Sci-Fi FR', description: 'Villes néon, cyberpunk, science-fiction, art futuriste.' },
            es: { name: 'Cyberpunk & Sci-Fi ES', description: 'Ciudades neón, cyberpunk, ciencia ficción, arte futurista.' },
            it: { name: 'Cyberpunk & Sci-Fi IT', description: 'Città al neon, cyberpunk, fantascienza, arte futuristica.' },
            nl: { name: 'Cyberpunk & Sci-Fi NL', description: 'Neon steden, cyberpunk, science fiction, futuristische kunst.' },
            pl: { name: 'Cyberpunk & Sci-Fi PL', description: 'Neonowe miasta, cyberpunk, science fiction, sztuka futurystyczna.' },
        }
    },
    // Furry Art Community
    {
        category: 'subculture',
        emoji: '🦊',
        color: '#FF9500',
        translations: {
            de: { name: 'Furry Art Community DE', description: 'Anthro Characters, Fursonas, Kemono, Tiercharaktere zeichnen.' },
            at: { name: 'Furry Art Community AT', description: 'Furry und Anthro Art Community aus Österreich.' },
            ch: { name: 'Furry Art Community CH', description: 'Furry und Anthro Art Community aus der Schweiz.' },
            global: { name: 'Furry Art Community', description: 'Anthro characters, fursonas, kemono, animal character art.' },
            us: { name: 'Furry Art Community USA', description: 'Furry and anthro art community from the US.' },
            uk: { name: 'Furry Art Community UK', description: 'Furry and anthro art community from the UK.' },
            fr: { name: 'Furry Art FR', description: 'Personnages anthro, fursonas, kemono, art de personnages animaux.' },
            es: { name: 'Furry Art ES', description: 'Personajes anthro, fursonas, kemono, arte de personajes animales.' },
            it: { name: 'Furry Art IT', description: 'Personaggi anthro, fursonas, kemono, arte di personaggi animali.' },
            nl: { name: 'Furry Art NL', description: 'Anthro characters, fursonas, kemono, dierenpersonage kunst.' },
            pl: { name: 'Furry Art PL', description: 'Postacie anthro, fursonas, kemono, sztuka postaci zwierząt.' },
        }
    },
    // Vintage & Retro Art
    {
        category: 'subculture',
        emoji: '📺',
        color: '#D4AF37',
        translations: {
            de: { name: 'Vintage & Retro Art DE', description: 'Art Deco, Mid-Century, Vintage Poster, Retro Illustration.' },
            at: { name: 'Vintage & Retro Art AT', description: 'Vintage und Retro Kunst aus Österreich.' },
            ch: { name: 'Vintage & Retro Art CH', description: 'Vintage und Retro Kunst aus der Schweiz.' },
            global: { name: 'Vintage & Retro Art', description: 'Art Deco, mid-century, vintage posters, retro illustration.' },
            us: { name: 'Vintage & Retro Art USA', description: 'Vintage and retro art from American artists.' },
            uk: { name: 'Vintage & Retro Art UK', description: 'Vintage and retro art from UK artists.' },
            fr: { name: 'Art Vintage & Rétro FR', description: 'Art Déco, mid-century, affiches vintage, illustration rétro.' },
            es: { name: 'Arte Vintage & Retro ES', description: 'Art Decó, mid-century, pósters vintage, ilustración retro.' },
            it: { name: 'Arte Vintage & Retrò IT', description: 'Art Déco, mid-century, poster vintage, illustrazione retrò.' },
            nl: { name: 'Vintage & Retro Kunst NL', description: 'Art Deco, mid-century, vintage posters, retro illustratie.' },
            pl: { name: 'Sztuka Vintage & Retro PL', description: 'Art Deco, mid-century, vintage plakaty, retro ilustracja.' },
        }
    },
];

// All regions to create rooms for
const allRegions = ['global', 'de', 'at', 'ch', 'us', 'uk', 'fr', 'es', 'it', 'nl', 'pl'];

// Generate room ID from name
function generateRoomId(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-äöüß]/g, '')
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/é/g, 'e')
        .replace(/è/g, 'e')
        .replace(/ê/g, 'e')
        .replace(/à/g, 'a')
        .replace(/ù/g, 'u')
        .replace(/ô/g, 'o')
        .replace(/î/g, 'i')
        .replace(/ñ/g, 'n')
        .replace(/ó/g, 'o')
        .replace(/í/g, 'i')
        .replace(/ą/g, 'a')
        .replace(/ę/g, 'e')
        .replace(/ł/g, 'l')
        .replace(/ń/g, 'n')
        .replace(/ś/g, 's')
        .replace(/ź/g, 'z')
        .replace(/ż/g, 'z')
        .replace(/ć/g, 'c');
}

// Generate all chatrooms
function generateAllRooms(): Chatroom[] {
    const rooms: Chatroom[] = [];
    
    for (const template of roomTemplates) {
        for (const region of allRegions) {
            const translation = template.translations[region];
            if (!translation) continue;
            
            rooms.push({
                name: translation.name,
                description: translation.description,
                category: template.category,
                region: region,
                emoji: template.emoji,
                color: template.color,
                isActive: true,
                isPinned: template.isPinned || false,
                membersCount: 0,
                onlineCount: 0,
                messagesCount: 0,
                createdAt: Date.now(),
            });
        }
    }
    
    return rooms;
}

async function seedChatrooms() {
    console.log('🚀 Starting chatroom seeding for ALL regions...\n');
    
    const defaultRooms = generateAllRooms();
    
    console.log(`📊 Generated ${defaultRooms.length} chatrooms for ${allRegions.length} regions\n`);
    
    // Group by region for display
    const byRegion: Record<string, Chatroom[]> = {};
    for (const room of defaultRooms) {
        if (!byRegion[room.region]) byRegion[room.region] = [];
        byRegion[room.region].push(room);
    }
    
    for (const [region, rooms] of Object.entries(byRegion)) {
        console.log(`\n🌍 Region: ${region.toUpperCase()} (${rooms.length} rooms)`);
        console.log('─'.repeat(50));
        
        for (const room of rooms) {
            const roomId = generateRoomId(room.name);
            
            try {
                await setDoc(doc(db, "chatrooms", roomId), room);
                console.log(`  ✅ ${room.emoji} ${room.name}`);
            } catch (error) {
                console.error(`  ❌ Failed: ${room.name}`, error);
            }
        }
    }
    
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`🎉 Done! Seeded ${defaultRooms.length} chatrooms across ${allRegions.length} regions.`);
    console.log(`${'═'.repeat(50)}\n`);
    
    process.exit(0);
}

seedChatrooms();
