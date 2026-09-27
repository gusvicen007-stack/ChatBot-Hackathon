import type { LevelOption, Topic } from '../types';
import { getTopics } from './syllabus';

export type NodeStatus = 'completed' | 'current' | 'locked';

export interface PathNode {
  topic: Topic;
  levelCode: string;
  status: NodeStatus;
  /** Posición dentro de su sección (base 0). */
  indexInSection: number;
}

export interface PathSection {
  levelCode: string;
  levelLabel: string;
  nodes: PathNode[];
}

/**
 * El "mundo" del curso: una sección por nivel, empezando por el nivel que el
 * alumno eligió al registrarse. Los temas se desbloquean en orden — solo el
 * primero sin terminar está disponible, y al cerrar un nivel se abre el siguiente.
 */
export function buildLearningPath(
  languageId: string,
  levels: LevelOption[],
  startLevel: string,
  isCompleted: (topicId: string) => boolean,
): PathSection[] {
  const startIndex = Math.max(
    0,
    levels.findIndex((l) => l.code === startLevel),
  );
  let currentAssigned = false;

  return levels.slice(startIndex).map((level) => {
    const nodes = getTopics(languageId, level.code).map((topic, indexInSection) => {
      let status: NodeStatus = 'locked';
      if (isCompleted(topic.id)) {
        status = 'completed';
      } else if (!currentAssigned) {
        status = 'current';
        currentAssigned = true;
      }
      return { topic, levelCode: level.code, status, indexInSection };
    });
    return { levelCode: level.code, levelLabel: level.label, nodes };
  });
}

/** Primer nodo disponible del mapa (o null si el alumno terminó todo). */
export function currentNode(sections: PathSection[]): PathNode | null {
  for (const section of sections) {
    const node = section.nodes.find((n) => n.status === 'current');
    if (node) return node;
  }
  return null;
}
