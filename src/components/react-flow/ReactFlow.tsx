import React, { RefObject, useEffect, useMemo, useRef } from "react";
import ReactFlow, { Background, Panel, useReactFlow } from "reactflow";
import "reactflow/dist/style.css";
import type { IConfig } from "./dataType";
import JsYaml from "js-yaml";
import useEdgeCreator from "./useEdgeCreator";
import { useFocus } from "~/contexts/EditorContext";
import { Maximize, Minus, Plus, HelpCircle, Lock } from "lucide-react";
import ParentNodeType from "./ParentNodeType";
import ReceiversNode from "./ReceiversNode";
import ProcessorsNode from "./ProcessorsNode";
import ExportersNode from "./ExportersNode";
import useConfigReader from "./useConfigReader";
import type { editor } from "monaco-editor";
import { ParseYaml } from "../../functions/ParseYaml";
import { ButtonGroup } from "@dash0/components/ui/button-group";
import { Button } from "@dash0hq/ui/src/components/ui/button";

type EditorRefType = RefObject<editor.IStandaloneCodeEditor | null>;

function isValidJson(jsonData: string) {
  try {
    JsYaml.load(jsonData);
    return true;
  } catch (e) {
    return false;
  }
}

export default function Flow({
  value,
  openDialog,
  locked,
  setLocked,
  editorRef,
}: {
  value: string;
  openDialog: (open: boolean) => void;
  locked: boolean;
  setLocked: (locked: boolean) => void;
  editorRef: EditorRefType | null;
}) {
  const reactFlowInstance = useReactFlow();
  const jsonData = useMemo(
    () => JsYaml.load(isValidJson(value) ? value : "") as IConfig,
    [value]
  );
  const initialNodes = useConfigReader(jsonData, reactFlowInstance);
  const initialEdges = useEdgeCreator(initialNodes, reactFlowInstance);
  const nodeTypes = useMemo(
    () => ({
      processorsNode: ProcessorsNode,
      receiversNode: ReceiversNode,
      exportersNode: ExportersNode,
      parentNodeType: ParentNodeType,
    }),
    []
  );

  const { setCenter } = useReactFlow();
  const nodeInfo = reactFlowInstance.getNodes();
  const docPipelines = ParseYaml("pipelines");
  const { setFocused } = useFocus();

  const edgeOptions = {
    animated: false,
    style: {
      stroke: "#fff",
    },
  };

  useEffect(() => {
    if (editorRef && editorRef.current && nodeInfo) {
      const cursorChangeEventListener =
        editorRef.current.onDidChangeCursorPosition(handleCursorPositionChange);
      return () => {
        cursorChangeEventListener.dispose();
      };
    }
  }, [locked, editorRef, nodeInfo]);

  function handleCursorPositionChange(e: editor.ICursorPositionChangedEvent) {
    if (!locked && editorRef?.current) {
      const cursorOffset =
        editorRef?.current?.getModel()?.getOffsetAt(e.position) || 0;

      const wordAtCursor: editor.IWordAtPosition = editorRef?.current
        ?.getModel()
        ?.getWordAtPosition(e.position) || {
        word: "",
        startColumn: 0,
        endColumn: 0,
      };

      for (let i = 0; docPipelines.value.items.length > i; i++) {
        if (
          cursorOffset >= docPipelines.value.items[i].key.offset &&
          cursorOffset <= docPipelines.value.items[i].sep[1].offset
        ) {
          setFocusOnParentNode(wordAtCursor.word);
          setCenter(
            getParentNodePositionX(wordAtCursor.word),
            getParentNodePositionY(wordAtCursor.word),
            { zoom: 1.2, duration: 400 }
          );
        }
        for (
          let j = 0;
          docPipelines.value.items[i].value.items.length > j;
          j++
        ) {
          if (
            docPipelines.value.items[i].value.items[j].value.items.length ===
              1 &&
            cursorOffset >=
              docPipelines.value.items[i].value.items[j].value.items[0].value
                .offset &&
            cursorOffset <=
              docPipelines.value.items[i].value.items[j].value.items[0].value
                .offset +
                docPipelines.value.items[i].value.items[j].value.items[0].value
                  .source.length
          ) {
            const level2 = docPipelines.value.items[i].key.source;
            const level3 =
              docPipelines.value.items[i].value.items[j].key.source;
            setFocusOnNode(wordAtCursor.word, level2, level3);
            setCenter(
              getNodePositionX(wordAtCursor.word, level2, level3) + 50,
              getNodePositionY(wordAtCursor.word, level2, level3) + 50,
              { zoom: 2, duration: 400 }
            );
          } else if (
            docPipelines.value.items[i].value.items[j].value.items.length > 1
          ) {
            for (
              let k = 0;
              docPipelines.value.items[i].value.items[j].value.items.length > k;
              k++
            ) {
              if (
                cursorOffset >=
                  docPipelines.value.items[i].value.items[j].value.items[k]
                    .value.offset &&
                cursorOffset <=
                  docPipelines.value.items[i].value.items[j].value.items[k]
                    .value.offset +
                    docPipelines.value.items[i].value.items[j].value.items[k]
                      .value.source.length
              ) {
                const level2 = docPipelines.value.items[i].key.source;
                const level3 =
                  docPipelines.value.items[i].value.items[j].key.source;
                setFocusOnNode(wordAtCursor.word, level2, level3);
                setCenter(
                  getNodePositionX(wordAtCursor.word, level2, level3) + 50,
                  getNodePositionY(wordAtCursor.word, level2, level3) + 50,
                  { zoom: 2, duration: 400 }
                );
              }
            }
          }
        }
      }
      if (
        cursorOffset > docPipelines.key.offset &&
        cursorOffset < docPipelines.sep[1].offset
      ) {
        reactFlowInstance.fitView();
      }
    }
  }

  function getNodePositionX(nodeId: string, level2: string, level3: string) {
    return (
      Number(
        nodeInfo?.find(
          (node) =>
            node.data.label === nodeId &&
            node.parentNode === level2 &&
            node.type?.includes(level3)
        )?.position?.x
      ) || 0
    );
  }

  function getNodePositionY(nodeId: string, level2: string, level3: string) {
    return (
      Number(
        nodeInfo?.find(
          (node) =>
            node.data.label === nodeId &&
            node.parentNode === level2 &&
            node.type?.includes(level3)
        )?.positionAbsolute?.y
      ) || 0
    );
  }

  function getParentNodePositionX(nodeId: string) {
    return (
      Number(
        nodeInfo?.find(
          (node) => node.id === nodeId && node.type === "parentNodeType"
        )?.position?.x
      ) + 350 || 0
    );
  }

  function getParentNodePositionY(nodeId: string) {
    return (
      Number(
        nodeInfo?.find(
          (node) => node.id === nodeId && node.type === "parentNodeType"
        )?.position?.y
      ) + 100 || 0
    );
  }

  function setFocusOnParentNode(nodeId: string) {
    const node = nodeInfo?.find(
      (node) => node.id === nodeId && node.type === "parentNodeType"
    );
    if (node) {
      setFocused(node.id);
    }
  }

  function setFocusOnNode(nodeId: string, level2: string, level3: string) {
    const node = nodeInfo?.find(
      (node) =>
        node.data.label === nodeId &&
        node.parentNode === level2 &&
        node.type?.includes(level3)
    );
    if (node) {
      setFocused(node.id);
    }
  }

  return (
    <ReactFlow
      nodes={initialNodes}
      edges={initialEdges}
      defaultEdgeOptions={edgeOptions}
      nodeTypes={nodeTypes}
      fitView
      style={{
        backgroundColor: "#000",
      }}
      className="disable-attribution"
      proOptions={{
        hideAttribution: true,
      }}
    >
      <Background />
      <Panel position="bottom-left" className="flex gap-x-3">
        <ButtonGroup size={"xs"}>
          <Button
            onClick={() => reactFlowInstance.zoomIn()}
            size="xs"
            variant="default"
          >
            <Plus />
          </Button>
          <Button
            onClick={() => reactFlowInstance.zoomOut()}
            size="xs"
            variant="default"
          >
            <Minus />
          </Button>
        </ButtonGroup>
        <Button
          onClick={() => reactFlowInstance.fitView()}
          size="xs"
          variant="default"
        >
          <Maximize />
        </Button>
        <Button
          className={`${locked && "bg-otelbinGrey"}`}
          onClick={() => setLocked(!locked)}
          size="xs"
          variant="default"
        >
          <Lock />
        </Button>
        <Button onClick={() => openDialog(true)} size="xs" variant="default">
          <HelpCircle />
        </Button>
      </Panel>
    </ReactFlow>
  );
}
