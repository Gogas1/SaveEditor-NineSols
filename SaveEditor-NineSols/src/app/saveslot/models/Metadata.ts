export interface SaveMetatada {
    exist: boolean;
    lastTeleportPointPath: string;
    atSceneGuid: string;
    lastPos: { x: number; y: number; z: number; }
    gold: number;
    level: number;
    exp: number;
    skillPointLeft: number;
    totalSkillLevel: number;
    playTime: number;
    deathCount: number;
    finishedCreditRoll: boolean;
    secondTimePlay: boolean;
    trueEndTriggered: boolean;
    badEndTriggered: boolean;
    gameMode: number;
    memoryMode: boolean;
}