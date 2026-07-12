# Hartă fluidă

Această versiune elimină resetările și flash-urile gri la deplasarea hărții.

- harta este creată o singură dată;
- tile-urile nu mai sunt redesenate global la erori individuale;
- bufferul de tile-uri este mai mare pentru deplasare fluidă;
- nu mai există ResizeObserver care să invalideze repetat harta;
- limitele Leaflet sunt aplicate fără panInsideBounds repetat;
- pinul de raportare este reutilizat, nu șters și recreat;
- GPS-ul setează locația o singură dată, fără watchPosition continuu;
- atingerea manuală pentru pin nu mai recentrează și nu mai schimbă zoom-ul;
- adminul nu mai invalidează harta la fiecare rerandare a listei.
