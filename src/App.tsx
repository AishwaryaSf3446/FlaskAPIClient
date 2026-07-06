

import { Grid, Columns, Column, TextAlign, EditType } from '@syncfusion/react-grid';
import './App.css'
import type {
  FilterSettings, SortSettings, PageSettings,
  DataRequestEvent, DataChangeRequestEvent,
  EditSettings, ColumnTemplateProps, ColumnHeaderTemplateProps,
  SearchSettings
} from '@syncfusion/react-grid';
import { useState, useEffect } from 'react';

interface GridData {
  result: Array<object>;
  count: number;
}

export default function App() {
  const [data, setData] = useState<GridData>({ result: [], count: 0 });

  const [filterSettings] = useState<FilterSettings>({ enabled: true });
  const [sortSettings] = useState<SortSettings>({ enabled: true });
  const [searchSettings] = useState<SearchSettings>({ enabled: true });
  const [pageSettings] = useState<PageSettings>({ enabled: true, pageCount: 4, pageSize: 10 });
  const [editSettings] = useState<EditSettings>({ allowEdit: true, allowAdd: true, allowDelete: true });
  const [toolbarSettings] = useState<string[]>(['Add', 'Edit', 'Delete', 'Update', 'Cancel', 'Search']);
  const validationRules = { required: true };
  const BASE_URL = "http://localhost:5000/tasks";

  useEffect(() => {
    renderComplete();
  }, []);

  function renderComplete() {
    const state: DataRequestEvent = { skip: 0, take: 10, requiresCounts: true };
    onDataRequest(state);
  }

  const onDataRequest = (state: DataRequestEvent | undefined) => {
    if (state) {
      const dataState: DataRequestEvent = {
        skip: state.skip ?? 0,
        take: state.take ?? 10,
        sort: state.sort,
        where: state.where,
        search: state.search,
        requiresCounts: true
      };
      execute(dataState).then((gridData: GridData) => setData(gridData));
    }
  };

  const onDataChangeRequest = async (args: DataChangeRequestEvent) => {
    try {
      if (args.action === 'Add') {
        await fetch(BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args.data)
        });
      } else if (args.action === 'Edit') {
        await fetch(`${BASE_URL}/${(args.data as any).TaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args.data)
        });
      } else if (args.action === 'Delete') {
        const deleteItems = args.data as any[];
        for (const item of deleteItems) {
          await fetch(`${BASE_URL}/${item.TaskId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      args.saveDataChanges();
    } catch (error) {
      console.error('CRUD operation failed:', error);
    }
  };

  function execute(state: DataRequestEvent): Promise<GridData> {
    return getData(state);
  }

  async function getData(state: DataRequestEvent): Promise<GridData> {
    try {
      const url = `${BASE_URL}?gridState=${encodeURIComponent(JSON.stringify(state))}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const value = await response.json();

      if (value.result) {
        return { result: value.result, count: value.count };
      }
      return { result: value, count: value.length };
    } catch (error) {
      console.error(error);
      return { result: [], count: 0 };
    }
  }

  const activeTemplate = (props: ColumnTemplateProps<{ IsActive: string }>) => {
    const value = String((props.data as { IsActive: string }).IsActive || '').trim();
    const isActive = value === 'Active';
    return (
      <span className={`badge-active ${isActive ? 'badge-active--on' : 'badge-active--off'}`}>
        <span className="badge-dot" />
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const statusConfig: Record<string, { bg: string; color: string; icon: string }> = {
    'In Progress': { bg: '#e8f4fd', color: '#1565c0', icon: '⏳' },
    'Completed': { bg: '#e8f5e9', color: '#2e7d32', icon: '✅' },
    'Pending': { bg: '#fff8e1', color: '#f57f17', icon: '🕐' },
    'On Hold': { bg: '#f3e5f5', color: '#6a1b9a', icon: '⏸' },
    'Cancelled': { bg: '#fce4ec', color: '#b71c1c', icon: '🚫' },
  };

  const statusTemplate = (props: ColumnTemplateProps<{ Status: string }>) => {
    const status = (props.data as { Status: string }).Status ?? 'Pending';
    const cfg = statusConfig[status] ?? { bg: '#f5f5f5', color: '#616161', icon: '•' };
    return (
      <span
        className="status-chip"
        style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}
      >
        <span style={{ fontSize: '11px' }}>{cfg.icon}</span>
        {status}
      </span>
    );
  };

  const priorityConfig: Record<string, { bg: string; color: string; icon: string }> = {
    'Low': { bg: '#dbeafe', color: '#1d4ed8', icon: '↓' },
    'Medium': { bg: '#fef3c7', color: '#b45309', icon: '=' },
    'High': { bg: '#fee2e2', color: '#dc2626', icon: '↑' },
    'Critical': { bg: '#fef2f2', color: '#991b1b', icon: '⇈' },
  };

  const headerTemplate = (icon: string, label: string) =>
    (_props: ColumnHeaderTemplateProps) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px' }}>{icon}</span>
        {label}
      </span>
    );

  const taskIdHeaderTemplate = headerTemplate('🔢', 'Task ID');
  const taskNameHeaderTemplate = headerTemplate('📝', 'Task Name');
  const projectHeaderTemplate = headerTemplate('🏷️', 'Project');
  const teamHeaderTemplate = headerTemplate('👥', 'Team');
  const categoryHeaderTemplate = headerTemplate('📂', 'Category');
  const priorityHeaderTemplate = headerTemplate('☰', 'Priority');
  const dueDateHeaderTemplate = headerTemplate('📅', 'Due Date');

  const projectTemplate = (props: ColumnTemplateProps<{ Project: string }>) => {
    const project = (props.data as { Project: string }).Project ?? 'Project';
    const initials = project
      .split(' ')
      .map(word => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('');

    return (
      <span className="project-pill">
        <span className="project-avatar">{initials}</span>
        <span>{project}</span>
      </span>
    );
  };
  const progressHeaderTemplate = headerTemplate('📊', 'Progress');
  const hoursHeaderTemplate = headerTemplate('⏱', 'Est. Hours');
  const activeHeaderTemplate = headerTemplate('🟢', 'Active Status');
  const statusHeaderTemplate = headerTemplate('📌', 'Task Status');

  const progressTemplate = (props: ColumnTemplateProps<{ Progress: number }>) => {
    const progress = Number((props.data as { Progress: number }).Progress ?? 0);
    return (
      <div className="progress-cell">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
        </div>
        <span>{progress}%</span>
      </div>
    );
  };

  const priorityTemplate = (props: ColumnTemplateProps<{ Priority: string }>) => {
    const priority = (props.data as { Priority: string }).Priority ?? 'Low';
    const cfg = priorityConfig[priority] ?? { bg: '#f5f5f5', color: '#616161', icon: '•' };

    return (
      <span className="priority-cell" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
        <span className={`priority-icon priority-icon--${priority.toLowerCase()}`}>{cfg.icon}</span>
        <span className="priority-text">{priority}</span>
      </span>
    );
  };

  return (
    <div>
      <header className="app-header">
        <span className="app-header__icon">📋</span>
        <h1>Task Management Dashboard</h1>
      </header>

      <main className="app-content">

        <div className="grid-card">
          <Grid
            dataSource={data}
            height={"50%"}
            sortSettings={sortSettings}
            filterSettings={filterSettings}
            pageSettings={pageSettings}
            onDataRequest={onDataRequest}
            onDataChangeRequest={onDataChangeRequest}
            editSettings={editSettings}
            toolbar={toolbarSettings}
            searchSettings={searchSettings}
          >
            <Columns>
              <Column field="TaskId" headerText="Task ID" headerTemplate={taskIdHeaderTemplate} width={110} textAlign={TextAlign.Right} isPrimaryKey={true} />
              <Column field="TaskName" headerText="Task Name" headerTemplate={taskNameHeaderTemplate} width={220} validationRules={validationRules} />
              <Column field="Project" headerText="Project" headerTemplate={projectHeaderTemplate} width={190} template={projectTemplate} validationRules={validationRules} />
              <Column field="Team" headerText="Team" headerTemplate={teamHeaderTemplate} width={130} validationRules={validationRules} />
              <Column field="Category" headerText="Category" headerTemplate={categoryHeaderTemplate} width={140} edit={{ type: EditType.DropDownList }} validationRules={validationRules} />
              <Column field="Priority" headerText="Priority" headerTemplate={priorityHeaderTemplate} width={140} template={priorityTemplate} edit={{type: EditType.DropDownList}} validationRules={validationRules} />
              <Column field="DueDate" headerText="Due Date" headerTemplate={dueDateHeaderTemplate} width={150} type="date" format="yMd" edit={{ type: EditType.DatePicker }} validationRules={validationRules} />
              <Column field="Progress" headerText="Progress" headerTemplate={progressHeaderTemplate} width={160} template={progressTemplate} textAlign={TextAlign.Right} />
              <Column field="EstimatedHours" headerText="Est. Hours" headerTemplate={hoursHeaderTemplate} width={130} textAlign={TextAlign.Right} validationRules={validationRules} />
              <Column field="IsActive" headerText="Active Status" headerTemplate={activeHeaderTemplate} width={150} template={activeTemplate} validationRules={validationRules} edit={{type: EditType.DropDownList}}/>
              <Column field="Status" headerText="Task Status" headerTemplate={statusHeaderTemplate} width={160} template={statusTemplate} edit={{type: EditType.DropDownList}} validationRules={validationRules} />
            </Columns>
          </Grid>
        </div>
      </main>
    </div>
  );
}
