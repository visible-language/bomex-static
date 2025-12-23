var speakers = [
	"Aaron",
	"Abinadi",
	"Abraham",
	"Adam",
	"Aha",
	"Ahaz",
	"Akish",
	"Alma",
	"Alma2",
	"Amalekite",
	"Amalickiah",
	"Ammaron",
	"Ammon",
	"Ammon2",
	"Ammoron",
	"Amulek",
	"Angels",
	"AntiNephiLehi",
	"Antionah",
	"Antipus",
	"Benjamin",
	"BrotherJared",
	"BrothersNephi",
	"CaptainMoroni",
	"ChiefJudge",
	"ChiefJudgeAmmonihah",
	"ChildrenLaman",
	"Christ",
	"Corianton",
	"Coriantumr",
	"DaughterJared",
	"DaughtersIshmael",
	"Enos",
	"Ether",
	"Eve",
	"FatherLamoni",
	"Gid",
	"Giddianhi",
	"Giddonah",
	"Gideon",
	"Godhead",
	"Helam",
	"Helaman",
	"Helaman3",
	"Helaman2",
	"Helorum",
	"Himni",
	"Isaiah",
	"Ishmael",
	"Jacob",
	"Jacob3",
	"Jared",
	"Jared2",
	"Jarom",
	"Joseph",
	"Joseph2",
	"KingLaman",
	"Noah",
	"KingLamanites",
	"Kishkumen",
	"Korihor",
	"Laban",
	"Lachoneus",
	"Laman",
	"LamaniteKing",
	"LamaniteQueen",
	"Lamoni",
	"Lehi",
	"Lehi2",
	"Lehi3",
	"Lehonti",
	"Lemuel",
	"Limhi",
	"Malachi",
	"Mormon",
	"Moroni",
	"Moses",
	"Mosiah",
	"Mosiah2",
	"MotherLamoni",
	"Nehor",
	"Nephi",
	"Nephi2",
	"Nephi3",
	"Omer",
	"Omner",
	"Omni",
	"Pahoran",
	"PriestsNoah",
	"Sam",
	"SamuelLamanite",
	"Sariah",
	"Satan",
	"ServantsFatherLamoni",
	"ServantHelaman",
	"ServantLamoni",
	"ServantsLamoni",
	"Sherem",
	"Shiblon",
	"Shiz",
	"ChildrenLemuel",
	"SonsIshmael",
	"StriplingWarriors",
	"Teancum",
	"ThreeNephites",
	"TwelveDisciples",
	"WifeIshmael",
	"WifeLamoni",
	"Zeezrom",
	"Zeniff",
	"Zenock",
	"Zenos",
	"Zerahemnah",
	"Zoram",
	"Zoram2",
	];
var speakers1 = [
	"Righteous",
	"Wicked",
	"Unknown",
	"Immortal",
	"Mixed",
	];

var speakers2 = [
	"Hebrew",
	"Nephite",
	"Prehistoric",
	"Jaredite",
	"Amalekite",
	"Mulekite",
	"Lamanite",
	"Immortal",
	"Zoramite",
	"Unknown",
	];	


var checkboxes1 = `
<div id="checkbox-holder">
<label class="container">Righteous
<input type="checkbox" id="Righteous" onclick="check(speakers1)">
<span class="checkmark Righteous"></span>
</label> 
<label class="container">Wicked
<input type="checkbox" id="Wicked" onclick="check(speakers1)">
<span class="checkmark Wicked"></span>
</label> 
<label class="container">Mixed
<input type="checkbox" id="Mixed" onclick="check(speakers1)">
<span class="checkmark Mixed"></span>
</label> 
<label class="container">Unknown
<input type="checkbox" id="Unknown" onclick="check(speakers1)">
<span class="checkmark Unknown"></span>
</label> 
<label class="container">Immortal
<input type="checkbox" id="Immortal" onclick="check(speakers1)">
<span class="checkmark Immortal"></span>
</label> 
</div>
`	

var checkboxes2 = `
<div id="checkbox-holder">
<label class="container">Hebrew
<input type="checkbox" id="Hebrew" onclick="check(speakers2)">
<span class="checkmark Hebrew"></span>
</label> 
<label class="container">Nephite
<input type="checkbox" id="Nephite" onclick="check(speakers2)">
<span class="checkmark Nephite"></span>
</label> 
<label class="container">Prehistoric
<input type="checkbox" id="Prehistoric" onclick="check(speakers2)">
<span class="checkmark Prehistoric"></span>
</label> 
<label class="container">Jaredite
<input type="checkbox" id="Jaredite" onclick="check(speakers2)">
<span class="checkmark Jaredite"></span>
</label> 
<label class="container">Amalekite
<input type="checkbox" id="Amalekite" onclick="check(speakers2)">
<span class="checkmark Amalekite"></span>
</label> 
<label class="container">Mulekite
<input type="checkbox" id="Mulekite" onclick="check(speakers2)">
<span class="checkmark Mulekite"></span>
</label> 
<label class="container">Lamanite
<input type="checkbox" id="Lamanite" onclick="check(speakers2)">
<span class="checkmark Lamanite"></span>
</label> 
<label class="container">Immortal
<input type="checkbox" id="Immortal" onclick="check(speakers2)">
<span class="checkmark Immortal"></span>
</label> 
<label class="container">Zoramite
<input type="checkbox" id="Zoramite" onclick="check(speakers2)">
<span class="checkmark Zoramite"></span>
</label> 
<label class="container">Unknown
<input type="checkbox" id="Unknown" onclick="check(speakers2)">
<span class="checkmark Unknown"></span>
</label> 
</div>
`

var checkboxes = `
<div id="checkbox-holder">
<label class="container">Aaron
<input type="checkbox" id="Aaron" onclick="check(speakers2)">
<span class="checkmark Aaron"></span>
</label> 
<label class="container">Abinadi
<input type="checkbox" id="Abinadi" onclick="check(speakers2)">
<span class="checkmark Abinadi"></span>
</label> 
<label class="container">Abraham
<input type="checkbox" id="Abraham" onclick="check(speakers2)">
<span class="checkmark Abraham"></span>
</label> 
<label class="container">Adam
<input type="checkbox" id="Adam" onclick="check(speakers2)">
<span class="checkmark Adam"></span>
</label> 
<label class="container">Aha
<input type="checkbox" id="Aha" onclick="check(speakers2)">
<span class="checkmark Aha"></span>
</label> 
<label class="container">Ahaz
<input type="checkbox" id="Ahaz" onclick="check(speakers2)">
<span class="checkmark Ahaz"></span>
</label> 
<label class="container">Akish
<input type="checkbox" id="Akish" onclick="check(speakers2)">
<span class="checkmark Akish"></span>
</label> 
<label class="container">Alma
<input type="checkbox" id="Alma" onclick="check(speakers2)">
<span class="checkmark Alma"></span>
</label> 
<label class="container">Alma the Younger
<input type="checkbox" id="Alma2" onclick="check(speakers2)">
<span class="checkmark Alma2"></span>
</label> 
<label class="container">Amalekite
<input type="checkbox" id="Amalekite" onclick="check(speakers2)">
<span class="checkmark Amalekite"></span>
</label> 
<label class="container">Amalickiah
<input type="checkbox" id="Amalickiah" onclick="check(speakers2)">
<span class="checkmark Amalickiah"></span>
</label> 
<label class="container">Ammaron
<input type="checkbox" id="Ammaron" onclick="check(speakers2)">
<span class="checkmark Ammaron"></span>
</label> 
<label class="container">Ammon Son of Mosiah
<input type="checkbox" id="Ammon" onclick="check(speakers2)">
<span class="checkmark Ammon"></span>
</label> 
<label class="container">Ammon the Mulekite
<input type="checkbox" id="Ammon2" onclick="check(speakers2)">
<span class="checkmark Ammon2"></span>
</label> 
<label class="container">Ammoron
<input type="checkbox" id="Ammoron" onclick="check(speakers2)">
<span class="checkmark Ammoron"></span>
</label> 
<label class="container">Amulek
<input type="checkbox" id="Amulek" onclick="check(speakers2)">
<span class="checkmark Amulek"></span>
</label> 
<label class="container">Angel
<input type="checkbox" id="Angels" onclick="check(speakers2)">
<span class="checkmark Angels"></span>
</label> 
<label class="container">Anti-Nephi-Lehi
<input type="checkbox" id="AntiNephiLehi" onclick="check(speakers2)">
<span class="checkmark AntiNephiLehi"></span>
</label> 
<label class="container">Antionah
<input type="checkbox" id="Antionah" onclick="check(speakers2)">
<span class="checkmark Antionah"></span>
</label> 
<label class="container">Antipus
<input type="checkbox" id="Antipus" onclick="check(speakers2)">
<span class="checkmark Antipus"></span>
</label> 
<label class="container">Benjamin
<input type="checkbox" id="Benjamin" onclick="check(speakers2)">
<span class="checkmark Benjamin"></span>
</label> 
<label class="container">Brother of Jared
<input type="checkbox" id="BrotherJared" onclick="check(speakers2)">
<span class="checkmark BrotherJared"></span>
</label> 
<label class="container">Brothers of Nephi
<input type="checkbox" id="BrothersNephi" onclick="check(speakers2)">
<span class="checkmark BrothersNephi"></span>
</label> 
<label class="container">Captain Moroni
<input type="checkbox" id="CaptainMoroni" onclick="check(speakers2)">
<span class="checkmark CaptainMoroni"></span>
</label> 
<label class="container">Chief Judge
<input type="checkbox" id="ChiefJudge" onclick="check(speakers2)">
<span class="checkmark ChiefJudge"></span>
</label> 
<label class="container">Chief Judge in Ammonihah
<input type="checkbox" id="ChiefJudgeAmmonihah" onclick="check(speakers2)">
<span class="checkmark ChiefJudgeAmmonihah"></span>
</label> 
<label class="container">Children of Laman
<input type="checkbox" id="ChildrenLaman" onclick="check(speakers2)">
<span class="checkmark ChildrenLaman"></span>
</label> 
<label class="container">Christ in America
<input type="checkbox" id="Christ" onclick="check(speakers2)">
<span class="checkmark Christ"></span>
</label> 
<label class="container">Corianton
<input type="checkbox" id="Corianton" onclick="check(speakers2)">
<span class="checkmark Corianton"></span>
</label> 
<label class="container">Coriantumr
<input type="checkbox" id="Coriantumr" onclick="check(speakers2)">
<span class="checkmark Coriantumr"></span>
</label> 
<label class="container">Daughter of Jared Son of Omer
<input type="checkbox" id="DaughterJared" onclick="check(speakers2)">
<span class="checkmark DaughterJared"></span>
</label> 
<label class="container">Daughters of Ishmael
<input type="checkbox" id="DaughtersIshmael" onclick="check(speakers2)">
<span class="checkmark DaughtersIshmael"></span>
</label> 
<label class="container">Enos
<input type="checkbox" id="Enos" onclick="check(speakers2)">
<span class="checkmark Enos"></span>
</label> 
<label class="container">Ether
<input type="checkbox" id="Ether" onclick="check(speakers2)">
<span class="checkmark Ether"></span>
</label> 
<label class="container">Eve
<input type="checkbox" id="Eve" onclick="check(speakers2)">
<span class="checkmark Eve"></span>
</label> 
<label class="container">Father of Lamoni
<input type="checkbox" id="FatherLamoni" onclick="check(speakers2)">
<span class="checkmark FatherLamoni"></span>
</label> 
<label class="container">Gid
<input type="checkbox" id="Gid" onclick="check(speakers2)">
<span class="checkmark Gid"></span>
</label> 
<label class="container">Giddianhi
<input type="checkbox" id="Giddianhi" onclick="check(speakers2)">
<span class="checkmark Giddianhi"></span>
</label> 
<label class="container">Giddonah
<input type="checkbox" id="Giddonah" onclick="check(speakers2)">
<span class="checkmark Giddonah"></span>
</label> 
<label class="container">Gideon
<input type="checkbox" id="Gideon" onclick="check(speakers2)">
<span class="checkmark Gideon"></span>
</label> 
<label class="container">Godhead
<input type="checkbox" id="Godhead" onclick="check(speakers2)">
<span class="checkmark Godhead"></span>
</label> 
<label class="container">Helam
<input type="checkbox" id="Helam" onclick="check(speakers2)">
<span class="checkmark Helam"></span>
</label> 
<label class="container">Helaman
<input type="checkbox" id="Helaman" onclick="check(speakers2)">
<span class="checkmark Helaman"></span>
</label> 
<label class="container">Helaman Son of Benjamin
<input type="checkbox" id="Helaman3" onclick="check(speakers2)">
<span class="checkmark Helaman3"></span>
</label> 
<label class="container">Helaman Son of Helaman
<input type="checkbox" id="Helaman2" onclick="check(speakers2)">
<span class="checkmark Helaman2"></span>
</label> 
<label class="container">Helorum
<input type="checkbox" id="Helorum" onclick="check(speakers2)">
<span class="checkmark Helorum"></span>
</label> 
<label class="container">Himni
<input type="checkbox" id="Himni" onclick="check(speakers2)">
<span class="checkmark Himni"></span>
</label> 
<label class="container">Isaiah
<input type="checkbox" id="Isaiah" onclick="check(speakers2)">
<span class="checkmark Isaiah"></span>
</label> 
<label class="container">Ishmael
<input type="checkbox" id="Ishmael" onclick="check(speakers2)">
<span class="checkmark Ishmael"></span>
</label> 
<label class="container">Jacob
<input type="checkbox" id="Jacob" onclick="check(speakers2)">
<span class="checkmark Jacob"></span>
</label> 
<label class="container">Jacob the Zoramite
<input type="checkbox" id="Jacob3" onclick="check(speakers2)">
<span class="checkmark Jacob3"></span>
</label> 
<label class="container">Jared
<input type="checkbox" id="Jared" onclick="check(speakers2)">
<span class="checkmark Jared"></span>
</label> 
<label class="container">Jared Son of Omer
<input type="checkbox" id="Jared2" onclick="check(speakers2)">
<span class="checkmark Jared2"></span>
</label> 
<label class="container">Jarom
<input type="checkbox" id="Jarom" onclick="check(speakers2)">
<span class="checkmark Jarom"></span>
</label> 
<label class="container">Joseph in Egypt
<input type="checkbox" id="Joseph" onclick="check(speakers2)">
<span class="checkmark Joseph"></span>
</label> 
<label class="container">Joseph
<input type="checkbox" id="Joseph2" onclick="check(speakers2)">
<span class="checkmark Joseph2"></span>
</label> 
<label class="container">King Laman
<input type="checkbox" id="KingLaman" onclick="check(speakers2)">
<span class="checkmark KingLaman"></span>
</label> 
<label class="container">King Noah
<input type="checkbox" id="Noah" onclick="check(speakers2)">
<span class="checkmark Noah"></span>
</label> 
<label class="container">King of the Lamanites
<input type="checkbox" id="KingLamanites" onclick="check(speakers2)">
<span class="checkmark KingLamanites"></span>
</label> 
<label class="container">Kishkumen
<input type="checkbox" id="Kishkumen" onclick="check(speakers2)">
<span class="checkmark Kishkumen"></span>
</label> 
<label class="container">Korihor
<input type="checkbox" id="Korihor" onclick="check(speakers2)">
<span class="checkmark Korihor"></span>
</label> 
<label class="container">Laban
<input type="checkbox" id="Laban" onclick="check(speakers2)">
<span class="checkmark Laban"></span>
</label> 
<label class="container">Lachoneus
<input type="checkbox" id="Lachoneus" onclick="check(speakers2)">
<span class="checkmark Lachoneus"></span>
</label> 
<label class="container">Laman
<input type="checkbox" id="Laman" onclick="check(speakers2)">
<span class="checkmark Laman"></span>
</label> 
<label class="container">Lamanite King
<input type="checkbox" id="LamaniteKing" onclick="check(speakers2)">
<span class="checkmark LamaniteKing"></span>
</label> 
<label class="container">Lamanite Queen
<input type="checkbox" id="LamaniteQueen" onclick="check(speakers2)">
<span class="checkmark LamaniteQueen"></span>
</label> 
<label class="container">Lamoni
<input type="checkbox" id="Lamoni" onclick="check(speakers2)">
<span class="checkmark Lamoni"></span>
</label> 
<label class="container">Lehi
<input type="checkbox" id="Lehi" onclick="check(speakers2)">
<span class="checkmark Lehi"></span>
</label> 
<label class="container">Lehi Son of Helaman
<input type="checkbox" id="Lehi2" onclick="check(speakers2)">
<span class="checkmark Lehi2"></span>
</label> 
<label class="container">Lehi Son of Zoram
<input type="checkbox" id="Lehi3" onclick="check(speakers2)">
<span class="checkmark Lehi3"></span>
</label> 
<label class="container">Lehonti
<input type="checkbox" id="Lehonti" onclick="check(speakers2)">
<span class="checkmark Lehonti"></span>
</label> 
<label class="container">Lemuel
<input type="checkbox" id="Lemuel" onclick="check(speakers2)">
<span class="checkmark Lemuel"></span>
</label> 
<label class="container">Limhi
<input type="checkbox" id="Limhi" onclick="check(speakers2)">
<span class="checkmark Limhi"></span>
</label> 
<label class="container">Malachi
<input type="checkbox" id="Malachi" onclick="check(speakers2)">
<span class="checkmark Malachi"></span>
</label> 
<label class="container">Mormon
<input type="checkbox" id="Mormon" onclick="check(speakers2)">
<span class="checkmark Mormon"></span>
</label> 
<label class="container">Moroni
<input type="checkbox" id="Moroni" onclick="check(speakers2)">
<span class="checkmark Moroni"></span>
</label> 
<label class="container">Moses
<input type="checkbox" id="Moses" onclick="check(speakers2)">
<span class="checkmark Moses"></span>
</label> 
<label class="container">Mosiah
<input type="checkbox" id="Mosiah" onclick="check(speakers2)">
<span class="checkmark Mosiah"></span>
</label> 
<label class="container">Mosiah Father of Benjamin
<input type="checkbox" id="Mosiah2" onclick="check(speakers2)">
<span class="checkmark Mosiah2"></span>
</label> 
<label class="container">Mother of Lamoni
<input type="checkbox" id="MotherLamoni" onclick="check(speakers2)">
<span class="checkmark MotherLamoni"></span>
</label> 
<label class="container">Nehor
<input type="checkbox" id="Nehor" onclick="check(speakers2)">
<span class="checkmark Nehor"></span>
</label> 
<label class="container">Nephi
<input type="checkbox" id="Nephi" onclick="check(speakers2)">
<span class="checkmark Nephi"></span>
</label> 
<label class="container">Nephi Son of Helaman
<input type="checkbox" id="Nephi2" onclick="check(speakers2)">
<span class="checkmark Nephi2"></span>
</label> 
<label class="container">Nephi Son of Nephi Son of Helaman
<input type="checkbox" id="Nephi3" onclick="check(speakers2)">
<span class="checkmark Nephi3"></span>
</label> 
<label class="container">Omer
<input type="checkbox" id="Omer" onclick="check(speakers2)">
<span class="checkmark Omer"></span>
</label> 
<label class="container">Omner
<input type="checkbox" id="Omner" onclick="check(speakers2)">
<span class="checkmark Omner"></span>
</label> 
<label class="container">Omni
<input type="checkbox" id="Omni" onclick="check(speakers2)">
<span class="checkmark Omni"></span>
</label> 
<label class="container">Pahoran
<input type="checkbox" id="Pahoran" onclick="check(speakers2)">
<span class="checkmark Pahoran"></span>
</label> 
<label class="container">Priests of Noah
<input type="checkbox" id="PriestsNoah" onclick="check(speakers2)">
<span class="checkmark PriestsNoah"></span>
</label> 
<label class="container">Sam
<input type="checkbox" id="Sam" onclick="check(speakers2)">
<span class="checkmark Sam"></span>
</label> 
<label class="container">Samuel the Lamanite
<input type="checkbox" id="SamuelLamanite" onclick="check(speakers2)">
<span class="checkmark SamuelLamanite"></span>
</label> 
<label class="container">Sariah
<input type="checkbox" id="Sariah" onclick="check(speakers2)">
<span class="checkmark Sariah"></span>
</label> 
<label class="container">Satan
<input type="checkbox" id="Satan" onclick="check(speakers2)">
<span class="checkmark Satan"></span>
</label> 
<label class="container">Servant of Father of Lamoni
<input type="checkbox" id="ServantsFatherLamoni" onclick="check(speakers2)">
<span class="checkmark ServantsFatherLamoni"></span>
</label> 
<label class="container">Servant of Helaman
<input type="checkbox" id="ServantHelaman" onclick="check(speakers2)">
<span class="checkmark ServantHelaman"></span>
</label> 
<label class="container">Servant of Lamoni
<input type="checkbox" id="ServantLamoni" onclick="check(speakers2)">
<span class="checkmark ServantLamoni"></span>
</label> 
<label class="container">Servants of Lamoni
<input type="checkbox" id="ServantsLamoni" onclick="check(speakers2)">
<span class="checkmark ServantsLamoni"></span>
</label> 
<label class="container">Sherem
<input type="checkbox" id="Sherem" onclick="check(speakers2)">
<span class="checkmark Sherem"></span>
</label> 
<label class="container">Shiblon
<input type="checkbox" id="Shiblon" onclick="check(speakers2)">
<span class="checkmark Shiblon"></span>
</label> 
<label class="container">Shiz
<input type="checkbox" id="Shiz" onclick="check(speakers2)">
<span class="checkmark Shiz"></span>
</label> 
<label class="container">Sons and Daughters of Lemuel
<input type="checkbox" id="ChildrenLemuel" onclick="check(speakers2)">
<span class="checkmark ChildrenLemuel"></span>
</label> 
<label class="container">Sons of Ishmael
<input type="checkbox" id="SonsIshmael" onclick="check(speakers2)">
<span class="checkmark SonsIshmael"></span>
</label> 
<label class="container">Stripling Warriors
<input type="checkbox" id="StriplingWarriors" onclick="check(speakers2)">
<span class="checkmark StriplingWarriors"></span>
</label> 
<label class="container">Teancum
<input type="checkbox" id="Teancum" onclick="check(speakers2)">
<span class="checkmark Teancum"></span>
</label> 
<label class="container">Three Nephites
<input type="checkbox" id="ThreeNephites" onclick="check(speakers2)">
<span class="checkmark ThreeNephites"></span>
</label> 
<label class="container">Twelve Disciples
<input type="checkbox" id="TwelveDisciples" onclick="check(speakers2)">
<span class="checkmark TwelveDisciples"></span>
</label> 
<label class="container">Wife of Ishmael
<input type="checkbox" id="WifeIshmael" onclick="check(speakers2)">
<span class="checkmark WifeIshmael"></span>
</label> 
<label class="container">Wife of Lamoni
<input type="checkbox" id="WifeLamoni" onclick="check(speakers2)">
<span class="checkmark WifeLamoni"></span>
</label> 
<label class="container">Zeezrom
<input type="checkbox" id="Zeezrom" onclick="check(speakers2)">
<span class="checkmark Zeezrom"></span>
</label> 
<label class="container">Zeniff
<input type="checkbox" id="Zeniff" onclick="check(speakers2)">
<span class="checkmark Zeniff"></span>
</label> 
<label class="container">Zenock
<input type="checkbox" id="Zenock" onclick="check(speakers2)">
<span class="checkmark Zenock"></span>
</label> 
<label class="container">Zenos
<input type="checkbox" id="Zenos" onclick="check(speakers2)">
<span class="checkmark Zenos"></span>
</label> 
<label class="container">Zerahemnah
<input type="checkbox" id="Zerahemnah" onclick="check(speakers2)">
<span class="checkmark Zerahemnah"></span>
</label> 
<label class="container">Zoram
<input type="checkbox" id="Zoram" onclick="check(speakers2)">
<span class="checkmark Zoram"></span>
</label> 
<label class="container">Zoram Captain of Nephites
<input type="checkbox" id="Zoram2" onclick="check(speakers2)">
<span class="checkmark Zoram2"></span>
</label> 
</div>
`;
