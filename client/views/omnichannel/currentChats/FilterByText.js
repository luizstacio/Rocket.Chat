import { TextInput, Box, MultiSelect, Select, InputBox } from '@rocket.chat/fuselage';
import { useMutableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import React, { useEffect, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import AutoCompleteAgent from '../../../components/AutoCompleteAgent';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import DeleteWarningModal from '../../../components/DeleteWarningModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { formsSubscription } from '../additionalForms';
import Label from './Label';
import RemoveAllClosed from './RemoveAllClosed';

const FilterByText = ({ setFilter, reload, ...props }) => {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const { value: allCustomFields } = useEndpointData('livechat/custom-fields');
	const statusOptions = [
		['all', t('All')],
		['closed', t('Closed')],
		['opened', t('Open')],
	];
	const customFieldsOptions = useMemo(
		() =>
			allCustomFields && allCustomFields.customFields
				? allCustomFields.customFields.map(({ _id, label }) => [_id, label])
				: [],
		[allCustomFields],
	);

	const [guest, setGuest] = useLocalStorage('guest', '');
	const [servedBy, setServedBy] = useLocalStorage('servedBy', 'all');
	const [status, setStatus] = useLocalStorage('status', 'all');
	const [department, setDepartment] = useLocalStorage('department', 'all');
	const [from, setFrom] = useLocalStorage('from', '');
	const [to, setTo] = useLocalStorage('to', '');
	const [tags, setTags] = useLocalStorage('tags', []);
	const [customFields, setCustomFields] = useLocalStorage('tags', []);

	const handleGuest = useMutableCallback((e) => setGuest(e.target.value));
	const handleServedBy = useMutableCallback((e) => setServedBy(e));
	const handleStatus = useMutableCallback((e) => setStatus(e));
	const handleDepartment = useMutableCallback((e) => setDepartment(e));
	const handleFrom = useMutableCallback((e) => setFrom(e.target.value));
	const handleTo = useMutableCallback((e) => setTo(e.target.value));
	const handleTags = useMutableCallback((e) => setTags(e));
	const handleCustomFields = useMutableCallback((e) => setCustomFields(e));

	const reset = useMutableCallback(() => {
		setGuest('');
		setServedBy('all');
		setStatus('all');
		setDepartment('all');
		setFrom('');
		setTo('');
		setTags([]);
		setCustomFields([]);
	});

	const forms = useSubscription(formsSubscription);

	const { useCurrentChatTags = () => {} } = forms;

	const Tags = useCurrentChatTags();

	const onSubmit = useMutableCallback((e) => e.preventDefault());
	const reducer = function (acc, curr) {
		acc[curr] = '';
		return acc;
	};

	useEffect(() => {
		setFilter({
			guest,
			servedBy,
			status,
			department,
			from: from && moment(new Date(from)).utc().format('YYYY-MM-DDTHH:mm:ss'),
			to: to && moment(new Date(to)).utc().format('YYYY-MM-DDTHH:mm:ss'),
			tags: tags.map((tag) => tag.label),
			customFields: customFields.reduce(reducer, {}),
		});
	}, [setFilter, guest, servedBy, status, department, from, to, tags, customFields]);

	const handleClearFilters = useMutableCallback(() => {
		reset();
	});

	const removeClosedChats = useMethod('livechat:removeAllClosedRooms');

	const handleRemoveClosed = useMutableCallback(async () => {
		const onDeleteAll = async () => {
			try {
				await removeClosedChats();
				reload();
				dispatchToastMessage({ type: 'success', message: t('Chat_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal onDelete={onDeleteAll} onCancel={() => setModal()} />);
	});

	return (
		<Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
			<Box display='flex' flexDirection='row' flexWrap='wrap' {...props}>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Guest')}</Label>
					<TextInput flexShrink={0} placeholder={t('Guest')} onChange={handleGuest} value={guest} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Served_By')}</Label>
					<AutoCompleteAgent value={servedBy} onChange={handleServedBy} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Department')}</Label>
					<AutoCompleteDepartment
						value={department}
						onChange={handleDepartment}
						label={t('All')}
						onlyMyDepartments
					/>
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Status')}</Label>
					<Select
						flexShrink={0}
						options={statusOptions}
						value={status}
						onChange={handleStatus}
						placeholder={t('Status')}
					/>
				</Box>
				<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
					<Label mb='x4'>{t('From')}</Label>
					<InputBox
						type='date'
						flexShrink={0}
						placeholder={t('From')}
						onChange={handleFrom}
						value={from}
					/>
				</Box>
				<Box display='flex' mie='x8' flexGrow={0} flexDirection='column'>
					<Label mb='x4'>{t('To')}</Label>
					<InputBox
						type='date'
						flexShrink={0}
						placeholder={t('To')}
						onChange={handleTo}
						value={to}
					/>
				</Box>

				<RemoveAllClosed
					handleClearFilters={handleClearFilters}
					handleRemoveClosed={handleRemoveClosed}
				/>
			</Box>
			{Tags && (
				<Box display='flex' flexDirection='row' marginBlockStart='x8' {...props}>
					<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
						<Label mb='x4'>{t('Tags')}</Label>
						<Tags value={tags} handler={handleTags} />
					</Box>
				</Box>
			)}
			{allCustomFields && (
				<Box display='flex' flexDirection='row' marginBlockStart='x8' {...props}>
					<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
						<Label mb='x4'>{t('Custom_Fields')}</Label>
						<MultiSelect
							options={customFieldsOptions}
							value={customFields}
							onChange={handleCustomFields}
							flexGrow={1}
							{...props}
						/>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default FilterByText;
