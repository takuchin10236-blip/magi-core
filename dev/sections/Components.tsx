/**
 * ⑤部品一覧 — `@magi/core/ui` の公開部品を variant 別に**実レンダリング**する。
 *
 * 画像でもコピーでもない。ここに出ているのは採用アプリが import するのと同じ実体で、
 * 上の帯でモードを切り替えると、この一覧の見た目もそのまま追従する（追従しなければ core のバグ）。
 *
 * 掟: props の値（文言・件数）は見本のための作り物だが、**部品・variant・クラスは実物**。
 *     ここで独自の見た目を足さない（足したくなったら core 側へ足すのが正しい道）。
 */
import { useMemo, useState } from 'react';
import {
  BusinessNav,
  Button,
  CheckboxField,
  ColorModeSwitch,
  ConfirmModal,
  DisplaySwitch,
  DraggableModal,
  EmptyState,
  FocusToggle,
  FormField,
  LoadingState,
  MagiAppShell,
  MagiBusinessSummary,
  MagiStatusSummary,
  MagiVersionChip,
  ManualEntry,
  NameWithRoom,
  NotificationBanner,
  OperatorChip,
  OperatorSelectModal,
  RadioGroup,
  RequirementBadge,
  SelectField,
  SgBrandLogo,
  SgLumenLogo,
  StatusBadge,
  TextArea,
  TextField,
  VersionHistoryModal,
  compactPersonName,
  useToast,
  type ManualContent,
  type ThemeMode,
  type ThemeModeSetting,
  type UiMode,
  type UiPreset,
} from '@magi/core/ui';
import { ChevronDown, Settings2, ShieldCheck, UserRound } from 'lucide-react';
import { Section, Specimen } from '../lib/Section';

interface Props {
  uiPreset: UiPreset;
  uiMode: UiMode;
  themeMode: ThemeMode;
  themeModeSetting: ThemeModeSetting;
  onUiPreset: (value: UiPreset) => void;
  onThemeMode: (value: ThemeMode) => void;
  onThemeModeSetting: (value: ThemeModeSetting) => void;
}

/** マニュアルビューアの中身（器＝core・中身＝アプリ、の「中身」側の見本）。 */
const MANUAL: ManualContent = {
  appName: 'デザインシステム ショーケース',
  appVersion: 'dev',
  subtitle: '器（ManualViewer）の実物確認用',
  sections: [
    {
      id: 'what',
      title: '① これは何か',
      summary: 'ショーケースの位置づけ',
      blocks: [
        { type: 'paragraph', text: 'このページは開発者が @magi/core の見た目と部品を1枚で点検するための検証用ページです。' },
        { type: 'note', tone: 'warning', text: '業務で使う画面ではありません。配布物にもしません。' },
        { type: 'analogy', text: 'たとえるなら、工具箱のふたを開けて中身を全部並べた状態です。' },
      ],
    },
    {
      id: 'how',
      title: '② 使い方',
      blocks: [
        {
          type: 'steps',
          items: ['上の帯で色モードを切り替える', '各節で部品の実物を触る', 'おかしければ core 側を直す（このページ側で取り繕わない）'],
        },
      ],
    },
  ],
};

const VERSION_HISTORY = [
  { version: 'v0.14.0', date: '2026-08-08', summary: '第3の色モード「残照」を追加（4プリセット×3モード＝12テーマ）' },
  { version: 'v0.13.7', date: '2026-08-05', summary: '背景スクロールの錠を公開API化' },
  { version: 'v0.12.0', date: '2026-07-31', summary: 'ヘッダーのパネル実体をCoreへ' },
];

const STAFF = [
  { id: 's1', name: '見本 太郎' },
  { id: 's2', name: '見本 花子' },
  { id: 's3', name: '見本 次郎' },
];

/** ToastProvider の中でしか使えないので、trigger だけ小さな子部品に分ける。 */
function ToastDemo() {
  const toast = useToast();
  return (
    <div className="ds-row">
      {/* useToast は種類ごとの関数を返す（show(type, msg) ではない）＝公開APIの現物に合わせる。 */}
      <Button onClick={() => toast.success('保存しました')} variant="secondary">
        success
      </Button>
      <Button onClick={() => toast.error('保存できませんでした')} variant="secondary">
        error
      </Button>
      <Button onClick={() => toast.info('3件を読み込みました')} variant="secondary">
        info
      </Button>
      <Button onClick={() => toast.warning('未保存の変更があります')} variant="secondary">
        warning
      </Button>
    </div>
  );
}

export function ComponentsSection(props: Props) {
  const { uiPreset, uiMode, themeMode, themeModeSetting, onUiPreset, onThemeMode, onThemeModeSetting } = props;

  const [text, setText] = useState('見本 太郎');
  const [area, setArea] = useState('朝食は全量摂取。');
  const [select, setSelect] = useState('2');
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState('b');
  const [busy, setBusy] = useState(false);
  const [confirmTone, setConfirmTone] = useState<'info' | 'warning' | 'danger' | null>(null);
  const [draggableOpen, setDraggableOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [operatorId, setOperatorId] = useState('s1');
  const [navTab, setNavTab] = useState('list');
  const [focus, setFocus] = useState(false);

  const operatorName = STAFF.find((s) => s.id === operatorId)?.name ?? null;

  /** 実際にこの節で描画している部品の名前（数を手で書かないため）。 */
  const rendered = useMemo(
    () => [
      'Button',
      'FormField',
      'RequirementBadge',
      'TextField',
      'TextArea',
      'SelectField',
      'CheckboxField',
      'RadioGroup',
      'StatusBadge',
      'NotificationBanner',
      'LoadingState',
      'EmptyState',
      'ToastProvider / useToast',
      'MagiStatusSummary',
      'MagiVersionChip',
      'MagiBusinessSummary',
      'NameWithRoom',
      'OperatorChip',
      'OperatorSelectModal',
      'ConfirmModal',
      'DraggableModal',
      'VersionHistoryModal',
      'ManualEntry',
      'ManualViewer',
      'MagiAppShell',
      'BusinessNav',
      'FocusToggle',
      'DisplaySwitch',
      'ColorModeSwitch',
      'SgLumenLogo',
      'SgBrandLogo',
    ],
    [],
  );

  return (
    <Section
      id="components"
      index="⑤"
      title={`部品の実物（${rendered.length}種）`}
      note={
        <>
          <code>@magi/core/ui</code> の公開部品を variant 別に実レンダリングしている（{rendered.length} 種）。
          計画書は「28種」と数えていたが、<strong>いま index.ts が公開している描画部品を数えると {rendered.length} 種</strong>
          （フック <code>useThemeState</code> / <code>useBusyGuard</code> と純関数は描画物でないため一覧に含めない）。
        </>
      }
    >
      <h3 className="ds-subhead">A. フォーム（DADS整合レイヤ v0.6）</h3>
      <div className="ds-grid-wide">
        <Specimen name="Button" tag="variant × 4 ＋ 状態" note="待ち状態は label 必須・busy 中は物理的に押せない（二重送信の防止）">
          <div className="ds-row">
            <Button variant="primary">保存する</Button>
            <Button variant="secondary">戻る</Button>
            <Button variant="danger">削除する</Button>
            <Button variant="ghost">閉じる</Button>
          </div>
          <div className="ds-row">
            <Button disabled>押せない</Button>
            <Button busy busyLabel="保存しています…">保存する</Button>
            <Button icon={<Settings2 aria-hidden="true" size={16} />}>設定</Button>
            <Button
              busy={busy}
              onClick={() => {
                setBusy(true);
                window.setTimeout(() => setBusy(false), 1200);
              }}
            >
              押すと1.2秒busy
            </Button>
          </div>
        </Specimen>

        <Specimen name="FormField / RequirementBadge" tag="器＋必須バッジ" note="ラベル・補足・エラーの aria 配線を器が持つ">
          <FormField label="居室番号" required supportText="半角数字で入力してください">
            {(control) => <input className="magi-input" {...control} defaultValue="201" />}
          </FormField>
          <div className="ds-row">
            <RequirementBadge required />
            <RequirementBadge required={false} />
          </div>
        </Specimen>

        <Specimen name="TextField" tag="通常 / 必須 / エラー">
          <TextField label="氏名" onChange={(e) => setText(e.target.value)} required supportText="姓と名の間は全角空白" value={text} />
          <TextField errorText="入力されていません" label="続柄" required value="" onChange={() => undefined} />
        </Specimen>

        <Specimen name="TextArea" tag="rows=3">
          <TextArea label="申し送り" onChange={(e) => setArea(e.target.value)} supportText="1行で言い切る" value={area} />
        </Specimen>

        <Specimen name="SelectField" tag="placeholder あり">
          <SelectField
            label="フロア"
            onChange={(e) => setSelect(e.target.value)}
            options={[
              { value: '1', label: '1F' },
              { value: '2', label: '2F' },
              { value: '3', label: '3F（工事中）', disabled: true },
            ]}
            placeholder="選択してください"
            value={select}
          />
        </Specimen>

        <Specimen name="CheckboxField / RadioGroup" tag="縦 / 横">
          <CheckboxField checked={checked} label="夜間の見守りを行う" onChange={setChecked} supportText="チェックすると夜勤帯の一覧に出ます" />
          <RadioGroup
            legend="食事形態"
            onChange={setRadio}
            options={[
              { value: 'a', label: '常食' },
              { value: 'b', label: '軟菜', supportText: '刻みは含まない' },
              { value: 'c', label: 'ミキサー', disabled: true },
            ]}
            required
            value={radio}
          />
          <RadioGroup
            inline
            legend="実施の有無"
            onChange={setRadio}
            options={[
              { value: 'a', label: 'あり' },
              { value: 'b', label: 'なし' },
            ]}
            value={radio}
          />
        </Specimen>
      </div>

      <h3 className="ds-subhead">B. 状態・フィードバック</h3>
      <div className="ds-grid-wide">
        <Specimen name="StatusBadge" tag="tone × 5" note="色だけで意味を伝えない＝必ず文字が入る">
          <div className="ds-row">
            <StatusBadge tone="ok">実施済み</StatusBadge>
            <StatusBadge tone="neutral">未入力</StatusBadge>
            <StatusBadge tone="warn">未保存</StatusBadge>
            <StatusBadge tone="danger">エラー</StatusBadge>
            <StatusBadge icon={<ShieldCheck aria-hidden="true" size={14} />} tone="info" tooltip="このPCの中だけで動いています">
              このPC内
            </StatusBadge>
          </div>
        </Specimen>

        <Specimen name="NotificationBanner" tag="tone × 4" note="error/warning は role=alert・種別ラベルつき">
          <NotificationBanner title="3件を読み込みました" tone="info" />
          <NotificationBanner title="保存しました" tone="success" />
          <NotificationBanner title="未保存の変更があります" tone="warning">
            画面を閉じる前に保存してください。
          </NotificationBanner>
          <NotificationBanner action={<Button variant="secondary">再試行</Button>} title="保存できませんでした" tone="error">
            通信が切れています。電波を確認してからもう一度お試しください。
          </NotificationBanner>
        </Specimen>

        <Specimen name="LoadingState" tag="block / inline" note="label 必須＝無言のスピナーを型で禁じている">
          <LoadingState label="読み込み中です。お待ちください" slowHint="件数が多いと時間がかかることがあります" />
          <LoadingState label="保存しています…" variant="inline" />
        </Specimen>

        <Specimen name="EmptyState" tag="0件表示">
          <EmptyState
            action={<Button variant="secondary">絞り込みを解除</Button>}
            hint="フロア・状態・検索の条件を見直してください"
            label="条件に合う記録がありません"
          />
        </Specimen>

        <Specimen name="ToastProvider / useToast" tag="type × 4" note="押すと画面右上に実物が出る（自動で消える）">
          <ToastDemo />
        </Specimen>

        <Specimen
          name="MagiStatusSummary"
          tag="検出器なし＝fail-closed"
          note="writeDetector を渡していないので「書込確認中」側に倒れる（安全側）。これが仕様どおりの姿。"
        >
          <MagiStatusSummary
            declaredStates={[{ kind: 'businessLive', value: false, basis: '検証用ページ（業務運用ではない）' }]}
            detailRows={[
              { label: 'データ接続', value: '（見本・接続なし）' },
              { label: '用途', value: '開発者検証' },
            ]}
          />
        </Specimen>

        <Specimen name="MagiVersionChip" tag="details 開閉">
          <MagiVersionChip
            buildTime="2026-08-09T13:00:00+09:00"
            details={{ core: '@magi/core v0.14.0', branch: 'feat/design-system-showcase-20260809' }}
            version="v0.14.0"
          />
        </Specimen>

        <Specimen name="MagiBusinessSummary" tag="業務ダッシュボード帯">
          <MagiBusinessSummary
            items={[
              { key: 'total', label: '入居者', value: 42 },
              { key: 'done', label: '記録済み', value: 38 },
              { key: 'left', label: '未記録', value: 4, description: '夕方までに入力してください' },
            ]}
            label="今日の状況"
          />
        </Specimen>
      </div>

      <h3 className="ds-subhead">C. 介護業務の語彙</h3>
      <div className="ds-grid-wide">
        <Specimen name="NameWithRoom / compactPersonName" tag="氏名＋居室">
          <div className="ds-row">
            <NameWithRoom name="見本 太郎" room="201" />
            <NameWithRoom name="見本 花子" room="B-3" roomPrefix="居室" />
            <NameWithRoom name="見本 次郎" />
          </div>
          <p className="ds-specimen-note">
            <code className="ds-mono">compactPersonName(&apos;見本 太郎&apos;)</code> ={' '}
            <code className="ds-mono">{compactPersonName('見本 太郎')}</code>
          </p>
        </Specimen>

        <Specimen name="OperatorChip / OperatorSelectModal" tag="操作者の選択">
          <div className="ds-row">
            <OperatorChip onClick={() => setOperatorOpen(true)} operatorName={operatorName} />
            <OperatorChip onClick={() => setOperatorOpen(true)} operatorName={null} />
          </div>
          <OperatorSelectModal
            onClose={() => setOperatorOpen(false)}
            onSelect={(id) => {
              setOperatorId(id);
              setOperatorOpen(false);
            }}
            open={operatorOpen}
            selectedOperatorId={operatorId}
            staff={STAFF}
          />
        </Specimen>
      </div>

      <h3 className="ds-subhead">D. オーバーレイ（押すと実物が開く）</h3>
      <div className="ds-grid-wide">
        <Specimen name="ConfirmModal" tag="tone × 3" note="ネイティブ confirm を撲滅するための共通確認モーダル">
          <div className="ds-row">
            <Button onClick={() => setConfirmTone('info')} variant="secondary">
              info
            </Button>
            <Button onClick={() => setConfirmTone('warning')} variant="secondary">
              warning
            </Button>
            <Button onClick={() => setConfirmTone('danger')} variant="danger">
              danger
            </Button>
          </div>
          {confirmTone ? (
            <ConfirmModal
              message="この操作は取り消せません。よろしいですか？"
              onClose={() => setConfirmTone(null)}
              onConfirm={() => setConfirmTone(null)}
              subtitle="見本（実際には何も起きません）"
              title="削除してよろしいですか？"
              tone={confirmTone}
            />
          ) : null}
        </Specimen>

        <Specimen name="DraggableModal" tag="ドラッグ可能な土台">
          <Button onClick={() => setDraggableOpen(true)} variant="secondary">
            開く
          </Button>
          {draggableOpen ? (
            <DraggableModal
              footer={<Button onClick={() => setDraggableOpen(false)}>閉じる</Button>}
              onClose={() => setDraggableOpen(false)}
              subtitle="見出しをつかんで動かせる"
              title="ドラッグできるモーダル"
            >
              <p>背景のスクロールは錠（lockBodyScroll）で止まっている。</p>
            </DraggableModal>
          ) : null}
        </Specimen>

        <Specimen name="VersionHistoryModal" tag="更新履歴">
          <Button onClick={() => setHistoryOpen(true)} variant="secondary">
            開く
          </Button>
          {historyOpen ? <VersionHistoryModal entries={VERSION_HISTORY} onClose={() => setHistoryOpen(false)} /> : null}
        </Specimen>

        <Specimen name="ManualEntry / ManualViewer" tag="器と中身" note="開くと全画面のページ型ビューア（左目次・右本文・検索）が出る">
          <ManualEntry content={MANUAL} />
        </Specimen>
      </div>

      <h3 className="ds-subhead">E. シェル・ナビ・テーマ切替</h3>
      <div className="ds-grid-wide">
        <Specimen name="DisplaySwitch" tag="開発者用（4プリセット × 陽光/月光）" note="残照は ColorModeSwitch 側が持つ（DisplaySwitch は従来の2値のまま）">
          <DisplaySwitch onThemeMode={onThemeMode} onUiPreset={onUiPreset} themeMode={themeMode} uiMode={uiMode} uiPreset={uiPreset} />
        </Specimen>

        <Specimen name="ColorModeSwitch" tag="職員向け 陽光/残照/月光/自動">
          <ColorModeSwitch
            onThemeMode={onThemeMode}
            onThemeModeSetting={onThemeModeSetting}
            themeMode={themeMode}
            themeModeSetting={themeModeSetting}
          />
        </Specimen>

        <Specimen name="FocusToggle" tag="作業面の全画面表示">
          <FocusToggle focusMode={focus} onFocusModeChange={setFocus} />
          <p className="ds-specimen-note">押すと下のシェル見本が全画面になる（Esc で必ず戻れる）。</p>
        </Specimen>

        <Specimen name="BusinessNav" tag="タブ＋メニュー（単体）">
          <BusinessNav
            activeTab={navTab}
            menuItems={[
              { key: 'settings', label: '設定', icon: <Settings2 aria-hidden="true" size={16} />, onSelect: () => undefined },
              { key: 'guard', label: '保護の状態', icon: <ShieldCheck aria-hidden="true" size={16} />, onSelect: () => undefined },
            ]}
            onNavigate={setNavTab}
            role="管理者"
            tabs={[
              { value: 'list', label: '一覧' },
              { value: 'input', label: '入力' },
              { value: 'report', label: '集計', icon: <ChevronDown aria-hidden="true" size={14} /> },
            ]}
          />
        </Specimen>
      </div>

      <h3 className="ds-subhead">MagiAppShell（骨格の実物・組み上げた姿）</h3>
      <p className="ds-note">
        シェルは <code className="ds-mono">min-height: 100vh</code> を持つ（実装どおり）。そのためページの中では縦に長く出る——
        これは崩れではなく、アプリ1枚を丸ごと収める器だから。
      </p>
      <div className="ds-card">
        <MagiAppShell
          appName="デザインシステム ショーケース"
          facilityName="第二湘南グリーン"
          floorName="2F"
          focusMode={focus}
          headerStatus={
            <MagiStatusSummary
              declaredStates={[{ kind: 'businessLive', value: false, basis: '検証用ページ（業務運用ではない）' }]}
            />
          }
          headerVersion={<MagiVersionChip buildTime="2026-08-09T13:00:00+09:00" version="v0.14.0" />}
          logo={<SgBrandLogo alt="" />}
          nav={
            <BusinessNav
              activeTab={navTab}
              menuChildren={<ManualEntry content={MANUAL} />}
              menuItems={[{ key: 'settings', label: '設定', icon: <Settings2 aria-hidden="true" size={16} />, onSelect: () => undefined }]}
              navActions={<ColorModeSwitch onThemeMode={onThemeMode} onThemeModeSetting={onThemeModeSetting} themeMode={themeMode} themeModeSetting={themeModeSetting} />}
              onNavigate={setNavTab}
              role="管理者"
              roleTitle="ログイン中の役割"
              tabs={[
                { value: 'list', label: '一覧' },
                { value: 'input', label: '入力' },
              ]}
            />
          }
          onFocusModeChange={setFocus}
        >
          <div className="ds-card">
            <div className="ds-row">
              <OperatorChip onClick={() => setOperatorOpen(true)} operatorName={operatorName} />
              <NameWithRoom name="見本 太郎" room="201" suffix={<StatusBadge tone="ok">実施済み</StatusBadge>} />
              <UserRound aria-hidden="true" size={20} />
            </div>
            <p className="ds-note">作業面（children）。ここにアプリの本体が入る。</p>
          </div>
        </MagiAppShell>
      </div>

      <h3 className="ds-subhead">ロゴ部品（詳細は⑦）</h3>
      <div className="ds-row">
        {/* SgLumenLogo は素の <svg>＝寸法を持たない（器が決める）。シェルが使う実クラスを当てて実寸で出す。 */}
        <SgLumenLogo className="magi-appshell-logo" />
        <SgBrandLogo alt="" />
      </div>
    </Section>
  );
}
