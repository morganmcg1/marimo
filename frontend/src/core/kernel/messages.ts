/* Copyright 2023 Marimo. All rights reserved. */

import { LayoutType } from "@/components/editor/renderers/types";
import { CellConfig, CellStatus } from "../cells/types";
import { CellId } from "../cells/ids";
import { VariableName } from "../variables/types";
import { RequestId } from "../network/DeferredRequestRegistry";

export type OutputChannel =
  | "output"
  | "console"
  | "media"
  | "marimo-error"
  | "stderr"
  | "stdout";

export type MarimoError =
  | { type: "syntax"; msg?: string }
  | { type: "interruption"; msg?: string }
  | {
      type: "exception";
      exception_type: string;
      msg: string;
      raising_cell?: CellId;
    }
  | { type: "ancestor-stopped"; msg: string; raising_cell: CellId }
  | { type: "cycle"; edges: Array<[CellId, CellId]> }
  | { type: "multiple-defs"; name: string; cells: CellId[] }
  | { type: "delete-nonlocal"; name: string; cells: CellId[] }
  | { type: "unknown"; msg?: string };

export type OutputMessage =
  | {
      channel: OutputChannel;
      mimetype: "application/vnd.marimo+error";
      data: MarimoError[];
      timestamp: number;
    }
  | {
      channel: OutputChannel;
      mimetype:
        | "text/plain"
        | "text/html"
        | "text/plain"
        | "image/png"
        | "image/svg+xml"
        | "image/tiff"
        | "image/avif"
        | "image/bmp"
        | "image/gif"
        | "image/jpeg"
        | "video/mp4"
        | "video/mpeg";
      data: string;
      timestamp: number;
    }
  | {
      channel: OutputChannel;
      mimetype: "application/json";
      data: unknown;
      timestamp: number;
    };

/**
 * Control messages sent from the kernel describing the execution state
 * and output (including errors) of a cell.
 */
export interface CellMessage {
  /**
   * The ID of the cell this message is about
   */
  cell_id: CellId;
  /**
   * The output of the cell, if any
   */
  output: OutputMessage | null;
  /**
   * The console output of the cell, if any
   */
  console: OutputMessage | OutputMessage[] | null;
  /**
   * Encodes status transitions. Non-null means a transition happened. Null
   * means no transition in status.
   */
  status: CellStatus | null;
  /**
   * Timestamp in seconds since epoch, when the message was sent
   */
  timestamp: number;
}

export interface CompletionOption {
  name: string;
  type: string;
  completion_info?: string;
}

/**
 * Message sent from the kernel in response to a completion request
 * from the frontend.
 */
export interface CompletionResultMessage {
  /**
   * The ID of the completion request
   */
  completion_id: RequestId;
  prefix_length: number;
  /**
   * The options for completion
   */
  options: CompletionOption[];
}

/**
 * Status code, and human readable explanation.
 */
export interface HumanReadableStatus {
  code: "ok" | "error";
  title?: string;
  message?: string;
}

/**
 * Message for function call results
 */
export interface FunctionCallResultMessage {
  /**
   * The ID of the function call
   */
  function_call_id: RequestId;
  /**
   * The result of the function call
   */
  return_value: unknown;
  /**
   * Status code and human readable info.
   */
  status: HumanReadableStatus;
}

/**
 * Message sent from the frontend to the kernel via the websocket.
 */
export type OperationMessage =
  | {
      op: "kernel-ready";
      data: {
        /**
         * The cell names
         */
        names: string[];
        /**
         * The cell codes. Will be empty in Read mode.
         */
        codes: string[];
        /**
         * The layout of the notebook
         * May be undefined if there is no layout set.
         */
        layout:
          | {
              /**
               * The type of the layout
               */
              type: LayoutType;
              /**
               * The serialized layout
               */
              data: unknown;
            }
          | undefined;
        /**
         * The cell configs.
         */
        configs: CellConfig[];
      };
    }
  | {
      op: "completed-run";
    }
  | {
      op: "interrupted";
    }
  | {
      op: "remove-ui-elements";
      data: {
        /**
         * The ID of the cell whose UI elements should be removed
         */
        cell_id: CellId;
      };
    }
  | {
      op: "completion-result";
      data: CompletionResultMessage;
    }
  | {
      op: "function-call-result";
      data: FunctionCallResultMessage;
    }
  | {
      op: "cell-op";
      data: CellMessage;
    }
  | {
      op: "variables";
      data: {
        variables: Array<{
          name: VariableName;
          declared_by: CellId[];
          used_by: CellId[];
        }>;
      };
    }
  | {
      op: "variable-values";
      data: {
        variables: Array<{
          name: VariableName;
          datatype?: string;
          value?: string;
        }>;
      };
    }
  | {
      op: "alert";
      data: {
        title: string;
        description: string;
        variant?: "danger";
      };
    };
